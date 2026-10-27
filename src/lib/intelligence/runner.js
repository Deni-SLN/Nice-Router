// Test queue.
//
// Bounded-concurrency worker pool over a model list. Responsibilities:
//   * enforce config.testConcurrency, testTimeoutMs and testRetries;
//   * refuse to spend money: paid models are skipped unless allowPaidTests;
//   * skip models whose cooldown has not expired and models tested recently;
//   * persist each outcome through the state machine and the event log;
//   * never let a throw escape a worker — one bad model must not kill the run.

import { getCapabilitiesForModel } from "open-sse/providers/capabilities.js";
import { getIntelConfig } from "./config.js";
import { probeModel, CHECK, resetProbeHeaderCache } from "./probe.js";
import { classifyFreeTier, FREE_STATUS } from "./freeTier.js";
import {
  evaluateRun, cooldownExpired, autoRetestAllowed, healthForOverride,
} from "./state.js";
import {
  HEALTH, listModelIntel, getModelIntel, updateModelIntelState, addModelIntelEvent, pruneHistory,
} from "@/lib/db/repos/modelIntelRepo.js";

let running = false;
let progress = null;

export function getTestRuntimeState() {
  return { running, progress };
}

/** Resolve capabilities + free status for one intel row. */
export function describeRow(row) {
  const capabilities = getCapabilitiesForModel(row.provider, row.model);
  const free = classifyFreeTier({
    provider: row.provider,
    model: row.model,
    adapterMeta: row.data?.meta || {},
    capabilities,
  });
  return { capabilities, free };
}

/**
 * Decide whether a model may be probed right now, and why not if it may not.
 * Returns { allowed: boolean, reason: string }.
 */
export function canTestRow(row, config, { now = Date.now(), force = false } = {}) {
  if (healthForOverride(row.manualOverride) === HEALTH.FAIL) {
    return { allowed: false, reason: "manually failed" };
  }
  const { free } = describeRow(row);

  // Cost control, applied before anything is sent.
  if (!config.allowPaidTests && free.status === FREE_STATUS.PAID) {
    return { allowed: false, reason: "paid model and paid tests are disabled" };
  }
  if (!config.allowPaidTests && free.status === FREE_STATUS.UNKNOWN) {
    return { allowed: false, reason: "pricing unknown and paid tests are disabled" };
  }

  if (force) return { allowed: true, reason: "forced" };
  if (row.quarantined && !autoRetestAllowed(row, config)) {
    return { allowed: false, reason: "quarantined beyond the automatic retest budget — restore manually" };
  }
  if (row.quarantined && !cooldownExpired(row, now)) {
    return { allowed: false, reason: "still in quarantine cooldown" };
  }
  if (row.lastTestedAt) {
    const last = Date.parse(row.lastTestedAt);
    const minGap = Math.max(0, Number(config.retestAfterMs) || 0);
    if (Number.isFinite(last) && now - last < minGap) {
      return { allowed: false, reason: "tested recently" };
    }
  }
  return { allowed: true, reason: "eligible" };
}

function buildRowModelId(row) {
  return `${row.provider}/${row.model}`;
}

/** Run the probe once with retries. Retries only fire for transient-looking errors. */
async function runWithRetries({ modelId, capabilities, config }) {
  const maxAttempts = Math.max(1, (Number(config.testRetries) || 0) + 1);
  let last = { checks: [], latencyMs: 0 };
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let result;
    try {
      result = await probeModel({ model: modelId, capabilities, config });
    } catch (error) {
      result = {
        checks: [{ check: CHECK.CONNECTIVITY, ok: false, message: String(error?.message || error).slice(0, 300), status: null }],
        latencyMs: 0,
      };
    }
    if (!result.skipped && result.checks.every((c) => c.ok || c.skipped)) {
      return { ...result, attempts: attempt };
    }
    // Retry only when the failure could plausibly be transient. Retrying a
    // "model does not exist" just burns the rate limit.
    const failure = result.checks.find((c) => c.ok === false);
    if (!failure || !isRetryable(failure) || attempt === maxAttempts) {
      return { ...result, attempts: attempt };
    }
    last = result;
    await delay(250 * attempt);
  }
  return { ...last, attempts: maxAttempts };
}

function isRetryable(check) {
  const message = String(check.message || "").toLowerCase();
  return /timed? ?out|etimedout|abort|fetch failed|econn|socket hang up|network|429|rate limit|overloaded|503|502|500/.test(message);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testOneRow(row, config, { force, now }) {
  const verdict = canTestRow(row, config, { now, force });
  if (!verdict.allowed) {
    return { provider: row.provider, model: row.model, status: "skipped", reason: verdict.reason, health: row.health };
  }

  const { capabilities, free } = describeRow(row);
  const modelId = buildRowModelId(row);
  const result = await runWithRetries({ modelId, capabilities, config });

  const nowIso = new Date().toISOString();
  if (result.skipped) {
    return {
      provider: row.provider, model: row.model, status: "skipped",
      reason: result.skipped, health: row.health, free: free.status,
    };
  }

  const recoveryRun = row.quarantined === true;
  // Re-read the row so a concurrent run's counters are not clobbered.
  const fresh = (await getModelIntel(row.provider, row.model)) || row;
  const decision = evaluateRun({ checks: result.checks, previous: fresh, config, now: Date.now(), recoveryRun });

  const latency = result.latencyMs || decision.patch.avgLatencyMs || null;
  const updated = await updateModelIntelState(row.provider, row.model, {
    ...decision.patch,
    lastTestedAt: nowIso,
    latencyMs: latency,
    testedCapabilities: result.checks.reduce((acc, c) => {
      acc[c.check] = c.skipped ? "skipped" : c.ok ? "pass" : "fail";
      return acc;
    }, {}),
    presentInCatalog: row.presentInCatalog !== false,
  });

  await addModelIntelEvent({
    timestamp: nowIso,
    modelIntelId: row.id,
    provider: row.provider,
    model: row.model,
    health: decision.health,
    ok: result.checks.every((c) => c.ok || c.skipped),
    latencyMs: latency,
    errorCategory: decision.errorCategory,
    errorScope: decision.errorScope,
    check: result.checks.find((c) => c.ok === false)?.check || null,
    retries: Math.max(0, (result.attempts || 1) - 1),
    message: decision.reason,
  });

  return {
    provider: row.provider,
    model: row.model,
    status: "tested",
    health: decision.health,
    previousHealth: fresh.health,
    reason: decision.reason,
    latencyMs: latency,
    attempts: result.attempts,
    free: free.status,
    quarantined: updated?.quarantined === true,
  };
}

/**
 * Test a set of models.
 *
 * @param {object} options
 * @param {string[]} [options.models]     explicit "provider/model" ids
 * @param {string} [options.provider]      restrict to one provider
 * @param {string[]} [options.healths]     restrict to these health states
 * @param {boolean} [options.quarantinedOnly]
 * @param {boolean} [options.force]        ignore cooldown / retest-gap
 * @param {number} [options.limit]
 */
export async function runModelTests(options = {}) {
  if (running) {
    return { status: "busy", message: "a model test run is already in progress" };
  }
  const config = await getIntelConfig();
  if (!options.force && config.testEnabled === false && !options.models) {
    return { status: "disabled", message: "model testing is disabled" };
  }

  const now = Date.now();
  let rows;
  if (options.models?.length) {
    rows = [];
    for (const id of options.models) {
      const slash = String(id).indexOf("/");
      if (slash <= 0) continue;
      const provider = id.slice(0, slash);
      const model = id.slice(slash + 1);
      const row = await getModelIntel(provider, model);
      if (row) rows.push(row);
    }
  } else {
    rows = await listModelIntel({
      ...(options.provider ? { provider: options.provider } : {}),
      ...(options.healths?.length ? { health: options.healths } : {}),
      ...(options.quarantinedOnly ? { quarantined: true } : {}),
    });
  }

  if (options.limit) rows = rows.slice(0, Math.max(1, Number(options.limit) || 1));
  if (!rows.length) {
    return { status: "empty", tested: 0, skipped: 0, results: [], finishedAt: new Date().toISOString() };
  }

  running = true;
  progress = {
    total: rows.length,
    done: 0,
    skipped: 0,
    tested: 0,
    startedAt: new Date(now).toISOString(),
  };

  const results = [];
  const concurrency = Math.max(1, Number(config.testConcurrency) || 2);
  let cursor = 0;

  const worker = async () => {
    for (;;) {
      const index = cursor++;
      if (index >= rows.length) return;
      const row = rows[index];
      let outcome;
      try {
        outcome = await testOneRow(row, config, { force: options.force === true, now });
      } catch (error) {
        outcome = {
          provider: row.provider, model: row.model, status: "error",
          reason: String(error?.message || error).slice(0, 200), health: row.health,
        };
      }
      results.push(outcome);
      progress.done++;
      if (outcome.status === "skipped") progress.skipped++;
      else progress.tested++;
    }
  };

  try {
    await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, worker));
  } finally {
    running = false;
  }

  // Trim the probe trail once per run rather than once per model.
  try { await pruneHistory(); } catch { /* history pruning is best-effort */ }
  resetProbeHeaderCache();

  const summary = { pass: 0, degraded: 0, fail: 0, unknown: 0 };
  for (const r of results) {
    if (r.health && summary[r.health.toLowerCase()] !== undefined) summary[r.health.toLowerCase()]++;
  }

  const finishedAt = new Date().toISOString();
  progress = { ...progress, finishedAt, summary };
  return {
    status: "ok",
    tested: progress.tested,
    skipped: progress.skipped,
    summary,
    results: results.sort((a, b) => (a.provider + a.model).localeCompare(b.provider + b.model)),
    startedAt: progress.startedAt,
    finishedAt,
  };
}

// ── Recovery sweep ───────────────────────────────────────────────────────────

/**
 * Retest quarantined models whose cooldown has expired. This is the "automatic
 * recovery" half of suppression — without it a quarantined model stays hidden
 * forever.
 */
export async function runRecoverySweep(options = {}) {
  const config = await getIntelConfig();
  const now = Date.now();
  const quarantined = await listModelIntel({ quarantined: true });
  const due = quarantined.filter((row) => cooldownExpired(row, now) && autoRetestAllowed(row, config));
  if (!due.length) {
    return { status: "ok", due: 0, tested: 0, results: [] };
  }
  return runModelTests({
    models: due.map(buildRowModelId),
    force: true,           // past cooldown and inside the retest budget
    ...options,
  });
}

/** Get the count of quarantined models whose cooldown has expired (need recovery). */
export async function listRecoverable() {
  const config = await getIntelConfig();
  const now = Date.now();
  const quarantined = await listModelIntel({ quarantined: true });
  const due = quarantined.filter((row) => cooldownExpired(row, now) && autoRetestAllowed(row, config));
  return due;
}

// ── Scheduler ────────────────────────────────────────────────────────────────
const STARTUP_DELAY_MS = 5 * 60 * 1000;
let timer = null;

export function startTestScheduler() {
  if (timer) return;
  if (String(process.env.MODEL_INTEL_TESTS || "").toLowerCase() === "off") return;

  const schedule = async (delayMs) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      const config = await getIntelConfig();
      if (config.testEnabled) {
        await runRecoverySweep().catch((e) => console.warn("[modelIntel] recovery sweep failed:", e?.message));
        await runModelTests().catch((e) => console.warn("[modelIntel] test run failed:", e?.message));
      }
      schedule(config.testIntervalMs || 6 * 60 * 60 * 1000);
    }, delayMs);
    timer.unref?.();
  };

  schedule(STARTUP_DELAY_MS);
}

export function stopTestScheduler() {
  if (timer) clearTimeout(timer);
  timer = null;
}
