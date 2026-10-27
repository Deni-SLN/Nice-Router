// Model selection: filters, ranking and eligibility.
//
// Two consumers:
//   * the dashboard's model browser (all filters apply);
//   * /v1/models (only the eligibility gate applies — health and quarantine
//     suppression, never the presentation filters).
//
// Free First never rewrites what a user configured. It orders what is *offered*.
// The only thing that changes routing is an explicit combo or auto-fallback
// setting the user already opted into; see assertFreeOnlySafe().

import { getCapabilitiesForModel } from "open-sse/providers/capabilities.js";
import { classifyFreeTier, FREE_STATUS } from "./freeTier.js";
import { HEALTH } from "@/lib/db/repos/modelIntelRepo.js";

export const FILTER = Object.freeze({
  ALL: "all",
  FREE_FIRST: "freeFirst",
  FREE_ONLY: "freeOnly",
  PAID_ONLY: "paidOnly",
  HEALTHY_ONLY: "healthyOnly",
});

export const FILTER_VALUES = Object.freeze(Object.values(FILTER));

const HEALTH_RANK = {
  [HEALTH.PASS]: 0,
  [HEALTH.DEGRADED]: 1,
  [HEALTH.UNKNOWN]: 2,
  [HEALTH.FAIL]: 3,
};

/** Everything the dashboard and the filter layer need to know about one model. */
export function enrichRow(row) {
  const capabilities = getCapabilitiesForModel(row.provider, row.model);
  const free = classifyFreeTier({
    provider: row.provider,
    model: row.model,
    adapterMeta: row.data?.meta || {},
    capabilities,
  });
  return {
    id: row.id,
    provider: row.provider,
    model: row.model,
    name: row.name || row.model,
    kind: row.data?.meta?.kind || row.kind || "llm",
    source: row.source || null,
    discovered: row.discovered === true,
    health: row.health || HEALTH.UNKNOWN,
    healthReason: row.healthReason || null,
    quarantined: row.quarantined === true,
    quarantinedUntil: row.quarantinedUntil || null,
    manualOverride: row.manualOverride || null,
    presentInCatalog: row.presentInCatalog !== false,
    lastTestedAt: row.lastTestedAt || null,
    lastSyncAt: row.lastSyncAt || null,
    latencyMs: row.latencyMs ?? null,
    avgLatencyMs: row.avgLatencyMs ?? null,
    errorCategory: row.errorCategory || null,
    errorScope: row.errorScope || null,
    testedCapabilities: row.testedCapabilities || null,
    free: free.status,
    freeReason: free.reason,
    price: free.price || null,
    capabilities: {
      tools: capabilities.tools !== false,
      vision: capabilities.vision === true,
      reasoning: capabilities.reasoning === true,
      contextWindow: capabilities.contextWindow,
      maxOutput: capabilities.maxOutput,
    },
  };
}

/**
 * Apply the dashboard filters. Unknown values are ignored rather than throwing
 * so a stale bookmark cannot break the page.
 */
export function applyFilters(models, filters = {}) {
  let out = models.filter((m) => m.presentInCatalog);

  if (filters.search) {
    const needle = String(filters.search).toLowerCase();
    out = out.filter((m) =>
      `${m.id} ${m.name}`.toLowerCase().includes(needle));
  }
  if (filters.provider) out = out.filter((m) => m.provider === filters.provider);
  if (filters.health) out = out.filter((m) => m.health === filters.health);

  const freeMode = FILTER_VALUES.includes(filters.filter) ? filters.filter : FILTER.ALL;
  if (freeMode === FILTER.FREE_ONLY) {
    // Unknown pricing is excluded: an unpriced model must never be selected by
    // a mode whose whole promise is "free".
    out = out.filter((m) => m.free === FREE_STATUS.FREE);
  } else if (freeMode === FILTER.PAID_ONLY) {
    out = out.filter((m) => m.free !== FREE_STATUS.FREE);
  }

  if (filters.healthyOnly || freeMode === FILTER.HEALTHY_ONLY) {
    out = out.filter((m) => m.health === HEALTH.PASS || m.health === HEALTH.DEGRADED);
  }
  if (filters.requireTools) out = out.filter((m) => m.capabilities.tools);
  if (filters.requireVision) out = out.filter((m) => m.capabilities.vision);

  const minContext = Number(filters.minContextWindow) || 0;
  if (minContext > 0) {
    out = out.filter((m) => Number.isFinite(m.capabilities.contextWindow) && m.capabilities.contextWindow >= minContext);
  }

  return sortModels(out, { freeFirst: freeMode === FILTER.FREE_FIRST || filters.freeFirst === true });
}

const FREE_RANK = { [FREE_STATUS.FREE]: 0, [FREE_STATUS.UNKNOWN]: 1, [FREE_STATUS.PAID]: 2 };

/**
 * Ranking order, in the order the brief specifies:
 *   1. free eligibility (only when Free First is on)
 *   2. health
 *   3. required capabilities (honoured by the filters above; ties broken by
 *      tools/vision so an agent that needs tools lands on one)
 *   4. context window / task suitability (bigger window first, then output cap)
 *   5. measured latency and reliability
 */
export function sortModels(models, { freeFirst = false } = {}) {
  return [...models].sort((a, b) => {
    if (freeFirst) {
      const fr = FREE_RANK[a.free] ?? 9;
      const frb = FREE_RANK[b.free] ?? 9;
      if (fr !== frb) return fr - frb;
    }
    const hr = HEALTH_RANK[a.health] ?? 9;
    const hrb = HEALTH_RANK[b.health] ?? 9;
    if (hr !== hrb) return hr - hrb;

    const toolsA = a.capabilities?.tools ? 0 : 1;
    const toolsB = b.capabilities?.tools ? 0 : 1;
    if (toolsA !== toolsB) return toolsA - toolsB;
    const visionA = a.capabilities?.vision ? 0 : 1;
    const visionB = b.capabilities?.vision ? 0 : 1;
    if (visionA !== visionB) return visionA - visionB;

    const ctxA = Number.isFinite(a.capabilities?.contextWindow) ? a.capabilities.contextWindow : -1;
    const ctxB = Number.isFinite(b.capabilities?.contextWindow) ? b.capabilities.contextWindow : -1;
    if (ctxA !== ctxB) return ctxB - ctxA;

    const outA = Number.isFinite(a.capabilities?.maxOutput) ? a.capabilities.maxOutput : -1;
    const outB = Number.isFinite(b.capabilities?.maxOutput) ? b.capabilities.maxOutput : -1;
    if (outA !== outB) return outB - outA;

    // Unknown latency sorts last — an untested model is not a fast one.
    const latA = Number.isFinite(a.avgLatencyMs) ? a.avgLatencyMs : Number.MAX_SAFE_INTEGER;
    const latB = Number.isFinite(b.avgLatencyMs) ? b.avgLatencyMs : Number.MAX_SAFE_INTEGER;
    return latA - latB;
  });
}

/**
 * The gateway gate: should this model appear in the default /v1/models list?
 *
 * Deliberately narrow. Only suppression-related state can hide a model — a
 * free/paid filter is a browsing preference and must never remove a model a
 * client has already been told about and may be configured to use.
 */
export function isEligibleForModelsList(entry, { hideFailed = true } = {}) {
  if (!entry) return true;
  if (entry.manualOverride) return true;   // an operator pinned it on purpose
  if (entry.presentInCatalog === false) return true;  // kept, user may still use it
  if (!hideFailed) return true;
  return entry.quarantined !== true;
}

/** A safe next hop for auto-fallback: eligible, and free if Free Only is on. */
export function pickFallback(models, { freeOnly = false } = {}) {
  const candidates = models.filter((m) => isEligibleForModelsList(m));
  const pool = freeOnly
    ? candidates.filter((m) => m.free === FREE_STATUS.FREE)
    : candidates;
  return sortModels(pool)[0] || null;
}

/**
 * Guard for the Free Only contract. Returns a list of violations; empty means
 * the routing plan can never reach a paid model.
 */
export function assertFreeOnlySafe(candidates, { freeOnly = false } = {}) {
  if (!freeOnly) return [];
  return candidates.filter((c) => c?.free !== FREE_STATUS.FREE);
}

export function summarizeModels(models) {
  const summary = {
    total: 0,
    // Kept but flagged absent upstream. Counted in total so every health and
    // pricing bucket below sums back to it.
    absent: 0,
    pass: 0,
    degraded: 0,
    fail: 0,
    unknown: 0,
    quarantined: 0,
    free: 0,
    paid: 0,
    pricingUnknown: 0,
    discovered: 0,
  };
  for (const m of models) {
    summary.total++;
    if (m.presentInCatalog === false) summary.absent++;
    if (m.discovered) summary.discovered++;
    const key = String(m.health || "").toLowerCase();
    if (summary[key] !== undefined) summary[key]++;
    if (m.quarantined) summary.quarantined++;
    if (m.free === FREE_STATUS.FREE) summary.free++;
    else if (m.free === FREE_STATUS.PAID) summary.paid++;
    else summary.pricingUnknown++;
  }
  return summary;
}
