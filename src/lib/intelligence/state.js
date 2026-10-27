// Health state machine.
//
// Pure functions: given the checks from one probe run, the model's previous
// row and the config, decide the new health and the columns to persist. No I/O
// — that keeps the suppression rules unit-testable without a database.
//
//   PASS     — every required check succeeded and no optional check failed
//   DEGRADED — usable, but a capability it advertises did not work
//   FAIL     — a model-scoped failure, repeated (or definitively fatal)
//   UNKNOWN  — never tested, or the evidence says nothing about the model
//
// The rule that matters most: only MODEL-scoped errors may move a model to
// FAIL. A bad API key, an exhausted quota, a 429 or a provider outage all leave
// the model exactly where it was and are recorded for diagnostics.

import { HEALTH, OVERRIDE } from "@/lib/db/repos/modelIntelRepo.js";
import { CATEGORY, SCOPE, classifyError, isModelScoped, explainNonModelScope } from "./classify.js";
import { REQUIRED_CHECKS } from "./probe.js";

const REQUIRED = new Set(REQUIRED_CHECKS);

export function isRequiredCheck(check) {
  return REQUIRED.has(check);
}

/** The failure that should decide the verdict: required checks outrank optional. */
function pickDecisiveFailure(checks) {
  const failures = checks.filter((c) => c.ok === false);
  if (!failures.length) return null;
  const required = failures.filter((c) => isRequiredCheck(c.check));
  return required[0] || failures[0];
}

export function backoffCooldownMs(quarantineCount, config) {
  const base = Math.max(0, Number(config?.cooldownMs) || 0);
  const max = Math.max(base, Number(config?.maxCooldownMs) || base);
  if (!base) return 0;
  // 1st quarantine -> base, 2nd -> 2x, 3rd -> 4x ... capped.
  const factor = 2 ** Math.max(0, (Number(quarantineCount) || 1) - 1);
  return Math.min(max, Math.round(base * factor));
}

export function autoRetestAllowed(row, config) {
  if (!row?.quarantined) return true;
  const max = Number(config?.maxAutomaticRetests);
  if (!Number.isFinite(max) || max <= 0) return false;
  return (row.quarantineCount || 0) < max;
}

export function cooldownExpired(row, now = Date.now()) {
  if (!row?.quarantinedUntil) return true;
  const until = Date.parse(row.quarantinedUntil);
  if (!Number.isFinite(until)) return true;
  return now >= until;
}

const OVERRIDE_TO_HEALTH = {
  [OVERRIDE.FORCE_PASS]: HEALTH.PASS,
  [OVERRIDE.FORCE_FAIL]: HEALTH.FAIL,
  [OVERRIDE.FORCE_DEGRADED]: HEALTH.DEGRADED,
};

export function healthForOverride(override) {
  return OVERRIDE_TO_HEALTH[override] || null;
}

/**
 * Decide the health transition for one probe run.
 *
 * @param {object} args
 * @param {object[]} args.checks    probe results
 * @param {object} args.previous    the modelIntel row before this run (may be null)
 * @param {object} args.config      intel config
 * @param {object} [args.now]       injectable clock (ms)
 * @param {boolean} [args.recoveryRun] true when this run was a quarantine retest
 * @returns {{
 *   health: string, reason: string, errorCategory: string|null, errorScope: string|null,
 *   patch: object, countsAsFailure: boolean, countsAsPass: boolean, stateChanged: boolean
 * }}
 */
export function evaluateRun({ checks = [], previous = null, config = {}, now = Date.now(), recoveryRun = false } = {}) {
  const prev = previous || {};
  const prevHealth = prev.health || HEALTH.UNKNOWN;

  // A manual override outranks every automatic transition, including recovery.
  const overridden = healthForOverride(prev.manualOverride);
  if (overridden) {
    return {
      health: overridden,
      reason: `manual override (${prev.manualOverride})`,
      errorCategory: null,
      errorScope: null,
      countsAsFailure: false,
      countsAsPass: false,
      stateChanged: prevHealth !== overridden || prev.quarantined === true,
      patch: { manualOverride: prev.manualOverride, quarantined: overridden === HEALTH.FAIL },
    };
  }

  const decisive = pickDecisiveFailure(checks);
  const latency = Number.isFinite(prev.avgLatencyMs) ? prev.avgLatencyMs : null;

  // Case 0: no evidence at all. An empty check list means the probe never got
  // anywhere, which is not a pass.
  if (!checks.length) {
    return {
      health: prevHealth,
      reason: "no checks were run",
      errorCategory: null,
      errorScope: null,
      countsAsFailure: false,
      countsAsPass: false,
      stateChanged: false,
      patch: {},
    };
  }

  // Case 1: a REQUIRED check failed for a reason that is not about the model.
  // A bad API key, an exhausted quota, a 429 or an outage must never quarantine
  // a model, so the verdict and the counters both stay exactly as they were and
  // only the diagnosis is recorded.
  if (decisive && isRequiredCheck(decisive.check) && !isDecisiveModelFailure(decisive)) {
    const { category, scope } = classifyError({
      status: decisive.status,
      message: decisive.message,
      check: decisive.check,
    });
    return {
      health: prevHealth,
      reason: explainNonModelScope(scope, category),
      errorCategory: category,
      errorScope: scope,
      countsAsFailure: false,
      countsAsPass: false,
      stateChanged: false,
      patch: {
        errorCategory: category,
        errorScope: scope,
        healthReason: explainNonModelScope(scope, category),
        lastError: truncate(decisive.message),
        retryCount: (prev.retryCount || 0) + 1,
      },
    };
  }

  // Optional capability checks are graded separately: failing one means "usable
  // but less capable" (DEGRADED), not "broken" (FAIL). An ACCOUNT or PROVIDER
  // scope suppresses the verdict, because an outage during a streaming probe
  // says nothing about whether the model supports streaming. An UNKNOWN scope
  // does NOT suppress: these failures are usually our own descriptive text
  // ("no SSE content deltas were returned") rather than a provider error, and
  // the probe has already established that the capability is missing.
  const optionalFailure = checks.find((c) => c.ok === false && !isRequiredCheck(c.check));
  const optionalIsModelIssue = optionalFailure
    ? !isInconclusiveScope(classifyError({
        status: optionalFailure.status,
        message: optionalFailure.message,
        check: optionalFailure.check,
      }).scope)
    : false;

  // Case 2: no required check failed.
  if (!decisive || !isRequiredCheck(decisive.check)) {
    const optionalFailure = checks.find((c) => c.ok === false && !isRequiredCheck(c.check));
    const observed = observedLatency(checks);
    const avg = rollingAverage(latency, observed);

    // An optional check failed for an account/provider reason - that is not
    // evidence about the model's capabilities either. Stay exactly where we are.
    if (optionalFailure && !optionalIsModelIssue) {
      const { category, scope } = classifyError({
        status: optionalFailure.status,
        message: optionalFailure.message,
        check: optionalFailure.check,
      });
      return {
        health: prevHealth,
        reason: explainNonModelScope(scope, category),
        errorCategory: category,
        errorScope: scope,
        countsAsFailure: false,
        countsAsPass: false,
        stateChanged: false,
        patch: {
          errorCategory: category,
          errorScope: scope,
          healthReason: explainNonModelScope(scope, category),
          lastError: truncate(optionalFailure.message),
        },
      };
    }

    const degraded = Boolean(optionalFailure);
    const optionalReason = degraded
      ? `usable; ${optionalFailure.check} check failed (${truncate(optionalFailure.message)})`
      : "all checks passed";

    if (recoveryRun && prev.quarantined) {
      const passes = (prev.consecutivePasses || 0) + 1;
      const needed = Math.max(1, Number(config?.recoveryPasses) || 2);
      if (passes < needed) {
        // Still inside the recovery window — stay quarantined. This is the
        // anti-flap rule: one lucky success does not put a flaky model back.
        return {
          health: HEALTH.FAIL,
          reason: `recovery ${passes}/${needed} — still quarantined`,
          errorCategory: null,
          errorScope: null,
          countsAsFailure: false,
          countsAsPass: true,
          stateChanged: false,
          patch: {
            consecutivePasses: passes,
            lastError: null,
            healthReason: `recovery ${passes}/${needed} — still quarantined`,
            avgLatencyMs: avg,
          },
        };
      }
      const restored = degraded ? HEALTH.DEGRADED : HEALTH.PASS;
      return {
        health: restored,
        reason: `recovered after ${passes} consecutive pass(es); restored as ${restored}`,
        errorCategory: degraded ? optionalFailure.check : null,
        errorScope: degraded ? SCOPE.MODEL : null,
        countsAsFailure: false,
        countsAsPass: true,
        stateChanged: true,
        patch: {
          health: restored,
          healthReason: `recovered after ${passes} consecutive pass(es)`,
          errorCategory: degraded ? optionalFailure.check : null,
          errorScope: degraded ? SCOPE.MODEL : null,
          consecutiveFailures: 0,
          consecutivePasses: 0,
          quarantined: false,
          quarantinedUntil: null,
          lastError: null,
          retryCount: 0,
          avgLatencyMs: avg,
        },
      };
    }

    const health = degraded ? HEALTH.DEGRADED : HEALTH.PASS;
    return {
      health,
      reason: optionalReason,
      errorCategory: degraded ? optionalFailure.check : null,
      errorScope: degraded ? SCOPE.MODEL : null,
      countsAsFailure: false,
      countsAsPass: true,
      stateChanged: health !== prevHealth || prev.quarantined === true,
      patch: {
        health,
        healthReason: optionalReason,
        errorCategory: degraded ? optionalFailure.check : null,
        errorScope: degraded ? SCOPE.MODEL : null,
        consecutiveFailures: 0,
        consecutivePasses: (prev.consecutivePasses || 0) + 1,
        lastError: null,
        retryCount: 0,
        avgLatencyMs: avg,
      },
    };
  }

  // ── Case 3: a model-scoped failure ────────────────────────────────────────
  const { category } = classifyError({
    status: decisive.status,
    message: decisive.message,
    check: decisive.check,
  });
  // A model the provider says does not exist will not come back on a retry.
  const definitive = category === CATEGORY.MODEL_NOT_FOUND;

  const failures = (prev.consecutiveFailures || 0) + 1;
  const threshold = Math.max(1, Number(config?.failureThreshold) || 3);
  const shouldFail = definitive || failures >= threshold;

  if (!shouldFail) {
    return {
      health: prev.quarantined ? HEALTH.FAIL : HEALTH.UNKNOWN,
      reason: `${category} on ${decisive.check} (${failures}/${threshold} before suppression)`,
      errorCategory: category,
      errorScope: SCOPE.MODEL,
      countsAsFailure: true,
      countsAsPass: false,
      stateChanged: false,
      patch: {
        consecutiveFailures: failures,
        consecutivePasses: 0,
        errorCategory: category,
        errorScope: SCOPE.MODEL,
        healthReason: `${category} on ${decisive.check} (${failures}/${threshold})`,
        lastError: truncate(decisive.message),
        retryCount: (prev.retryCount || 0) + 1,
      },
    };
  }

  const enteringQuarantine = !prev.quarantined;
  const quarantineCount = (prev.quarantineCount || 0) + (enteringQuarantine ? 1 : 0);
  const cooldown = backoffCooldownMs(quarantineCount, config);
  const reason = definitive
    ? `${category}: ${truncate(decisive.message)}`
    : `${category} on ${decisive.check} x${failures} (threshold ${threshold})`;

  return {
    health: HEALTH.FAIL,
    reason,
    errorCategory: category,
    errorScope: SCOPE.MODEL,
    countsAsFailure: true,
    countsAsPass: false,
    stateChanged: true,
    patch: {
      health: HEALTH.FAIL,
      healthReason: reason,
      errorCategory: category,
      errorScope: SCOPE.MODEL,
      consecutiveFailures: failures,
      consecutivePasses: 0,
      // Never deleted — quarantined means hidden from the default active list
      // and listed on the diagnostics page instead.
      quarantined: true,
      quarantineCount,
      quarantinedUntil: new Date(now + cooldown).toISOString(),
      lastError: truncate(decisive.message),
      retryCount: (prev.retryCount || 0) + 1,
    },
  };
}

function isDecisiveModelFailure(check) {
  const { category } = classifyError({ status: check.status, message: check.message, check: check.check });
  return isModelScoped(category);
}

/** ACCOUNT and PROVIDER scopes say nothing about the model; MODEL/UNKNOWN may. */
function isInconclusiveScope(scope) {
  return scope === SCOPE.ACCOUNT || scope === SCOPE.PROVIDER;
}

export function observedLatency(checks = []) {
  const values = checks.map((c) => c.latencyMs).filter((v) => Number.isFinite(v) && v > 0);
  if (!values.length) return null;
  // The completion round trip dominates; extras are diagnostics.
  return Math.round(Math.max(...values));
}

function rollingAverage(previousAvg, observed) {
  if (!Number.isFinite(observed)) return previousAvg ?? null;
  if (!Number.isFinite(previousAvg) || previousAvg <= 0) return observed;
  return Math.round(previousAvg * 0.7 + observed * 0.3);
}

function truncate(value, max = 300) {
  if (value == null) return null;
  return String(value).slice(0, max);
}
