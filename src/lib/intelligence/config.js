// Model intelligence configuration.
//
// Stored as one nested key (`intelligence`) inside the existing settings row so
// it needs no schema change and survives export/import with everything else.
// A DB written before this feature has no `intelligence` key at all — the
// defaults below cover that, which is why this never touches DEFAULT_SETTINGS.

import { getSettings, updateSettings } from "@/lib/localDb.js";

export const DEFAULT_INTELLIGENCE_CONFIG = Object.freeze({
  // Phase 4 — suppression
  enabled: true,
  // Consecutive model-scoped failures before a model leaves the active list.
  failureThreshold: 3,
  // Consecutive passes required before a quarantined model is restored. >1 is
  // what stops a flaky model from oscillating in and out of the catalog.
  recoveryPasses: 2,
  // Base cooldown before a quarantined model is retested automatically.
  cooldownMs: 15 * 60 * 1000,
  // Each quarantine doubles the cooldown, up to this ceiling.
  maxCooldownMs: 24 * 60 * 60 * 1000,
  // A model whose cooldown would exceed this keeps out of automatic retesting.
  maxAutomaticRetests: 5,

  // Phase 2 — discovery
  syncEnabled: true,
  syncIntervalMs: 12 * 60 * 60 * 1000,
  providers: { openrouter: true },
  // Models marked absent upstream are kept, not deleted — see modelIntelRepo.
  keepMissingModels: true,

  // Phase 3 — testing
  testEnabled: true,
  testIntervalMs: 6 * 60 * 60 * 1000,
  testConcurrency: 2,
  testTimeoutMs: 20000,
  testRetries: 2,
  // Cost control. When false, a probe against a model with a non-zero price is
  // skipped rather than billed. See probe.js.
  allowPaidTests: false,
  // Extra probes cost more tokens and can be flakier; off by default.
  testStreaming: true,
  testToolCalling: true,
  testMultimodal: false,
  // Refuse to probe models whose context window exceeds this — long-context
  // probes are the easiest way to spend money by accident.
  maxTestContextWindow: 400000,
  // Only probe a model again after this long unless asked directly.
  retestAfterMs: 6 * 60 * 60 * 1000,

  // Phase 6 — gateway surface
  // /v1/models hides quarantined models by default. Admin callers can ask for
  // the full catalog with ?full=1 (or an API key with access.allow including
  // "models:all"); see eligibility.js.
  hideFailedFromModelsList: true,

  // Phase 5 — selection defaults. These are presentation/sorting defaults for
  // the dashboard and the eligibility API. They never rewrite a stored combo
  // or an explicitly configured model.
  freeFirst: false,
  freeOnly: false,
  healthyOnly: false,
  minContextWindow: 0,
  requireTools: false,
  requireVision: false,
});

const NUMERIC_BOUNDS = {
  failureThreshold: [1, 20],
  recoveryPasses: [1, 10],
  cooldownMs: [0, 30 * 24 * 60 * 60 * 1000],
  maxCooldownMs: [60 * 1000, 30 * 24 * 60 * 60 * 1000],
  maxAutomaticRetests: [0, 1000],
  syncIntervalMs: [60 * 1000, 30 * 24 * 60 * 60 * 1000],
  testIntervalMs: [60 * 1000, 30 * 24 * 60 * 60 * 1000],
  testConcurrency: [1, 16],
  testTimeoutMs: [1000, 300000],
  testRetries: [0, 5],
  maxTestContextWindow: [0, 100000000],
  retestAfterMs: [0, 30 * 24 * 60 * 60 * 1000],
  minContextWindow: [0, 100000000],
};

const BOOLEAN_KEYS = [
  "enabled", "syncEnabled", "keepMissingModels", "testEnabled", "allowPaidTests",
  "testStreaming", "testToolCalling", "testMultimodal", "hideFailedFromModelsList",
  "freeFirst", "freeOnly", "healthyOnly", "requireTools", "requireVision",
];

function clamp(key, value) {
  const bounds = NUMERIC_BOUNDS[key];
  const n = Number(value);
  if (!bounds || !Number.isFinite(n)) return undefined;
  return Math.min(Math.max(n, bounds[0]), bounds[1]);
}

/** Whitelist + clamp an untrusted patch. Unknown keys are dropped. */
export function sanitizeIntelConfig(patch = {}) {
  const out = {};
  if (!patch || typeof patch !== "object") return out;
  for (const key of BOOLEAN_KEYS) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) out[key] = patch[key] === true || patch[key] === "true";
  }
  for (const key of Object.keys(NUMERIC_BOUNDS)) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    const clamped = clamp(key, patch[key]);
    if (clamped !== undefined) out[key] = clamped;
  }
  if (patch.providers && typeof patch.providers === "object" && !Array.isArray(patch.providers)) {
    const providers = {};
    for (const [k, v] of Object.entries(patch.providers).slice(0, 64)) {
      if (typeof k !== "string" || k.length > 64) continue;
      providers[k] = v === true || v === "true";
    }
    out.providers = providers;
  }
  return out;
}

export async function getIntelConfig() {
  let stored = null;
  try {
    const settings = await getSettings();
    stored = settings?.intelligence;
  } catch {
    // DB not ready yet — defaults still serve the caller.
    return { ...DEFAULT_INTELLIGENCE_CONFIG };
  }
  const merged = { ...DEFAULT_INTELLIGENCE_CONFIG };
  if (stored && typeof stored === "object") {
    for (const key of Object.keys(DEFAULT_INTELLIGENCE_CONFIG)) {
      if (Object.prototype.hasOwnProperty.call(stored, key) && stored[key] != null) {
        merged[key] = stored[key];
      }
    }
    merged.providers = {
      ...DEFAULT_INTELLIGENCE_CONFIG.providers,
      ...(stored.providers && typeof stored.providers === "object" ? stored.providers : {}),
    };
  }
  // Re-clamp: a hand-edited settings row must not be able to stall the queue.
  const safe = sanitizeIntelConfig(merged);
  return { ...merged, ...safe, providers: merged.providers };
}

export async function updateIntelConfig(patch) {
  const clean = sanitizeIntelConfig(patch);
  if (!Object.keys(clean).length) return getIntelConfig();
  const current = await getIntelConfig();
  const next = { ...current, ...clean, providers: { ...current.providers, ...(clean.providers || {}) } };
  await updateSettings({ intelligence: next });
  return getIntelConfig();
}
