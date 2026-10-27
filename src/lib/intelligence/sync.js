// Catalog synchronization.
//
// Runs a set of provider adapters, normalizes their payloads, and writes them
// into modelIntel idempotently. Three invariants:
//
//   1. Idempotent — importing the same catalog twice changes nothing and
//      reports every row as `unchanged`.
//   2. Non-destructive — a model that disappears upstream is flagged
//      presentInCatalog=0 and kept. Aliases, combos, enabled-model lists and
//      health history survive.
//   3. Health is untouched — sync only writes identity/metadata columns. A
//      model that was PASS stays PASS across a resync.

import {
  getAdapterFor, listAdapterIds, providerIdForAdapter,
} from "./adapters/index.js";
import { modalitiesToCaps } from "./adapters/types.js";
import { getIntelConfig } from "./config.js";
import {
  upsertDiscoveredModel, markMissing, recordSyncRun, invalidateIntelCache,
} from "@/lib/db/repos/modelIntelRepo.js";
import { getProviderConnections } from "@/lib/localDb.js";

const DEFAULT_TIMEOUT_MS = 20000;

let running = false;
let lastRun = null;

export function getSyncRuntimeState() {
  return { running, lastRun, adapters: listAdapterIds() };
}

// Pick the connection whose credentials should authenticate a catalog fetch.
// Active first, then lowest priority number, matching the router's own order.
async function pickConnection(providerId) {
  try {
    const connections = await getProviderConnections({ provider: providerId });
    const list = Array.isArray(connections) ? connections : [];
    const active = list.filter((c) => c.isActive !== false);
    const pool = active.length ? active : list;
    if (!pool.length) return null;
    return [...pool].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))[0];
  } catch {
    return null;
  }
}

function buildMeta(record) {
  return {
    ...record,
    caps: modalitiesToCaps(record.inputModalities, record.outputModalities),
  };
}

async function syncOneProvider(adapterId, { timeoutMs, connection }) {
  const adapter = getAdapterFor(adapterId);
  if (!adapter) {
    return { provider: adapterId, status: "skipped", reason: "no adapter", errors: ["no adapter registered"] };
  }
  const provider = providerIdForAdapter(adapterId);

  if (adapter.requiresConnection && !connection) {
    return {
      provider, adapterId, status: "skipped",
      reason: "no active connection", errors: ["no active connection for this provider"],
    };
  }

  let records = [];
  try {
    records = await adapter.fetchModels(connection, { timeoutMs });
  } catch (error) {
    // A failed fetch must not mark anything missing — the catalog may just be
    // unreachable. Log the failure and leave every row alone.
    return {
      provider, adapterId, status: "error",
      reason: error?.message || String(error),
      errors: [error?.message || String(error)],
      imported: 0, updated: 0, unchanged: 0,
    };
  }

  const imported = [];
  const updated = [];
  const unchanged = [];
  const seen = [];

  for (const record of records) {
    seen.push(record.model);
    const action = await upsertDiscoveredModel({
      provider,
      model: record.model,
      name: record.name,
      kind: record.kind,
      source: adapterId,
      meta: buildMeta(record),
    });
    if (action === "imported") imported.push(record.model);
    else if (action === "updated") updated.push(record.model);
    else unchanged.push(record.model);
  }

  let missingMarked = 0;
  try {
    missingMarked = await markMissing(provider, seen);
  } catch (error) {
    return {
      provider, adapterId, status: "partial",
      reason: `catalog imported but missing-marker failed: ${error?.message || error}`,
      errors: [String(error?.message || error)],
      imported: imported.length, updated: updated.length, unchanged: unchanged.length,
    };
  }

  return {
    provider, adapterId, status: "ok",
    imported: imported.length, updated: updated.length, unchanged: unchanged.length,
    missingMarked,
    sample: { imported: imported.slice(0, 5), updated: updated.slice(0, 5) },
  };
}

/**
 * @param {object} options
 * @param {string[]} [options.providers] - adapter ids; default = config-enabled ones
 * @param {string} [options.trigger] - "manual" | "schedule"
 * @param {number} [options.timeoutMs]
 */
export async function syncCatalog(options = {}) {
  if (running) {
    return { status: "busy", message: "a catalog sync is already running" };
  }
  running = true;
  const started = Date.now();
  const config = await getIntelConfig();

  let targetProviders = Array.isArray(options.providers) && options.providers.length
    ? options.providers
    : Object.entries(config.providers || {})
        .filter(([, enabled]) => enabled)
        .map(([id]) => id);

  // Only ids we actually have an adapter for — a stale config entry is skipped,
  // not an error.
  targetProviders = targetProviders.filter((id) => getAdapterFor(id));
  if (!targetProviders.length) {
    running = false;
    const result = { status: "empty", providers: [], imported: 0, updated: 0, unchanged: 0, errors: [], durationMs: 0 };
    lastRun = result;
    return result;
  }

  const results = [];
  const errors = [];
  try {
    // Sequential on purpose: one provider at a time keeps the request rate low
    // and respects provider terms. Concurrency here buys nothing.
    for (const adapterId of targetProviders) {
      const provider = providerIdForAdapter(adapterId);
      const connection = await pickConnection(provider);
      const res = await syncOneProvider(adapterId, {
        timeoutMs: options.timeoutMs || DEFAULT_TIMEOUT_MS,
        connection,
      });
      results.push(res);
      for (const err of res.errors || []) errors.push(`${res.provider}: ${err}`);
    }

    const totals = results.reduce(
      (acc, r) => ({
        imported: acc.imported + (r.imported || 0),
        updated: acc.updated + (r.updated || 0),
        unchanged: acc.unchanged + (r.unchanged || 0),
      }),
      { imported: 0, updated: 0, unchanged: 0 }
    );

    const status = errors.length && !totals.imported && !totals.updated && !totals.unchanged ? "error" : "ok";
    const result = {
      status,
      trigger: options.trigger || "manual",
      timestamp: new Date().toISOString(),
      providers: results,
      ...totals,
      errorCount: errors.length,
      errors: errors.slice(0, 20),
      durationMs: Date.now() - started,
    };

    try {
      await recordSyncRun({
        timestamp: result.timestamp,
        trigger: result.trigger,
        status,
        imported: totals.imported,
        updated: totals.updated,
        unchanged: totals.unchanged,
        errorCount: errors.length,
        durationMs: result.durationMs,
        errors: errors.slice(0, 20),
      });
    } catch {
      // A history write failure must not fail the sync itself.
    }

    lastRun = result;
    invalidateIntelCache();
    return result;
  } finally {
    running = false;
  }
}

// ── Scheduler ────────────────────────────────────────────────────────────────
const STARTUP_DELAY_MS = 90 * 1000;   // let the server serve first requests
const RETRY_DELAY_MS = 30 * 60 * 1000;

let timer = null;

function schedule(delay, intervalMs) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(async () => {
    const config = await getIntelConfig();
    if (!config.syncEnabled) return;
    const result = await syncCatalog({ trigger: "schedule" });
    const next = result && result.status !== "error" ? config.syncIntervalMs : RETRY_DELAY_MS;
    schedule(next || intervalMs, next || intervalMs);
  }, delay);
  timer.unref?.();
}

export function startCatalogSyncScheduler() {
  if (timer) return;
  if (String(process.env.MODEL_INTEL_SYNC || "").toLowerCase() === "off") return;
  schedule(STARTUP_DELAY_MS);
}

export function stopCatalogSyncScheduler() {
  if (timer) clearTimeout(timer);
  timer = null;
}
