// Manual controls: restore, force-fail, force-pass, clear override.
//
// Every one of these only touches intelligence state. None of them deletes a
// model, and none of them writes to the user's disabledModels / alias / combo
// configuration — suppression here is a routing opinion, not a deletion.

import {
  HEALTH, OVERRIDE, listModelIntel, updateModelIntelState, addModelIntelEvent,
} from "@/lib/db/repos/modelIntelRepo.js";
import { healthForOverride, cooldownExpired } from "./state.js";

const VALID_OVERRIDES = new Set(Object.values(OVERRIDE));

export function sanitizeOverride(value) {
  if (value === null || value === "" || value === undefined) return null;
  const s = String(value).toUpperCase();
  return VALID_OVERRIDES.has(s) ? s : null;
}

/**
 * @param {string} provider
 * @param {string} model
 * @param {string|null} override  FORCE_PASS | FORCE_FAIL | FORCE_DEGRADED | null
 * @param {object} [options] { reason }
 */
export async function setModelOverride(provider, model, override, options = {}) {
  const clean = sanitizeOverride(override);
  if (!provider || !model) throw new Error("provider and model are required");
  const forced = healthForOverride(clean);
  const reason = clean
    ? `manual override: ${clean}${options.reason ? ` (${options.reason})` : ""}`
    : "manual override cleared";

  const updated = await updateModelIntelState(provider, model, {
    health: forced || HEALTH.UNKNOWN,
    healthReason: reason,
    manualOverride: clean,
    // A forced failure quarantines; clearing an override releases the model back
    // into the normal (tested) pool without erasing its history.
    quarantined: forced === HEALTH.FAIL,
    quarantinedUntil: null,
    consecutiveFailures: 0,
    consecutivePasses: 0,
    ...(forced && forced !== HEALTH.FAIL ? { lastError: null } : {}),
  });

  await addModelIntelEvent({
    modelIntelId: `${provider}/${model}`,
    provider,
    model,
    health: forced || HEALTH.UNKNOWN,
    ok: forced === HEALTH.PASS,
    message: reason,
    check: "manual",
  });

  return updated;
}

/**
 * Release a quarantined model without asserting it is healthy: health goes back
 * to UNKNOWN, so it is routable again but still clearly untested rather than
 * claiming a PASS it never earned.
 */
export async function restoreModel(provider, model, options = {}) {
  if (!provider || !model) throw new Error("provider and model are required");
  const updated = await updateModelIntelState(provider, model, {
    health: HEALTH.UNKNOWN,
    healthReason: options.reason || "manually restored — awaiting a test run",
    manualOverride: null,
    quarantined: false,
    quarantinedUntil: null,
    consecutiveFailures: 0,
    consecutivePasses: 0,
    lastError: null,
  });
  await addModelIntelEvent({
    modelIntelId: `${provider}/${model}`,
    provider,
    model,
    health: HEALTH.UNKNOWN,
    ok: true,
    message: "restored",
    check: "manual",
  });
  return updated;
}

/** Bulk release for "Restore All" on the diagnostics page. */
export async function restoreAllQuarantined() {
  const quarantined = await listModelIntel({ quarantined: true });
  const restored = [];
  for (const row of quarantined) {
    await restoreModel(row.provider, row.model, { reason: "bulk restore" });
    restored.push(row.id);
  }
  return { restored: restored.length, ids: restored };
}

/** Quarantined models whose cooldown has run out — the automatic retest queue. */
export async function listRecoverable(now = Date.now()) {
  const quarantined = await listModelIntel({ quarantined: true });
  return quarantined.filter((row) => cooldownExpired(row, now));
}
