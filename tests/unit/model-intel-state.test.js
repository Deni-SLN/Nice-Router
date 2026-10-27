// Phase 3 + 4: the health state machine.
// Covers the four states, the suppression threshold, cooldown backoff, recovery
// gating, flap prevention, and the provider-outage-vs-model-failure distinction
// as it actually reaches the persisted row.
import { describe, it, expect } from "vitest";
import { evaluateRun, backoffCooldownMs, cooldownExpired, autoRetestAllowed } from "@/lib/intelligence/state.js";
import { HEALTH, OVERRIDE } from "@/lib/db/repos/modelIntelRepo.js";

const CONFIG = {
  failureThreshold: 3,
  recoveryPasses: 2,
  cooldownMs: 1000,
  maxCooldownMs: 60000,
  maxAutomaticRetests: 3,
};

const ok = (check) => ({ check, ok: true, latencyMs: 100 });
const bad = (check, message, status = null) => ({ check, ok: false, latencyMs: 100, message, status });
const skip = (check) => ({ check, ok: true, skipped: true, message: "not applicable" });

const FULL_PASS = [ok("connectivity"), ok("auth"), ok("completion"), ok("schema"), ok("streaming"), ok("tool_calling")];

describe("PASS / DEGRADED / UNKNOWN", () => {
  it("all required and optional checks green -> PASS", () => {
    const d = evaluateRun({ checks: FULL_PASS, previous: null, config: CONFIG });
    expect(d.health).toBe(HEALTH.PASS);
    expect(d.patch.consecutiveFailures).toBe(0);
    expect(d.stateChanged).toBe(true);
  });

  it("required checks green but streaming fails -> DEGRADED, not FAIL", () => {
    const d = evaluateRun({
      checks: [...FULL_PASS.slice(0, 5), bad("streaming", "no SSE content deltas were returned")],
      previous: { health: HEALTH.PASS },
      config: CONFIG,
    });
    expect(d.health).toBe(HEALTH.DEGRADED);
    expect(d.patch.quarantined).toBeUndefined();
    expect(d.countsAsFailure).toBe(false);
  });

  it("tool calling failing is DEGRADED too", () => {
    const d = evaluateRun({
      checks: [...FULL_PASS.slice(0, 5), bad("tool_calling", "HTTP 400: This model does not support tools")],
      previous: null,
      config: CONFIG,
    });
    expect(d.health).toBe(HEALTH.DEGRADED);
  });

  it("a skipped check does not degrade the model", () => {
    const d = evaluateRun({
      checks: [ok("connectivity"), ok("auth"), ok("completion"), ok("schema"), skip("streaming"), skip("tool_calling")],
      previous: null,
      config: CONFIG,
    });
    expect(d.health).toBe(HEALTH.PASS);
  });

  it("a never-tested model stays UNKNOWN", () => {
    expect(evaluateRun({ checks: [], previous: null, config: CONFIG }).health).toBe(HEALTH.UNKNOWN);
  });
});

describe("provider outage vs model failure", () => {
  it("a 401 from a rotated key leaves a healthy model healthy", () => {
    const d = evaluateRun({
      checks: [ok("connectivity"), bad("auth", "HTTP 401: Unauthorized", 401), bad("completion", "HTTP 401", 401)],
      previous: { health: HEALTH.PASS, consecutiveFailures: 0, quarantineCount: 0 },
      config: CONFIG,
    });
    expect(d.health).toBe(HEALTH.PASS);
    expect(d.countsAsFailure).toBe(false);
    expect(d.patch.quarantined).toBeUndefined();
    expect(d.errorCategory).toBe("auth_invalid");
    expect(d.errorScope).toBe("ACCOUNT");
  });

  it("an outage on a fresh model leaves it UNKNOWN rather than failing it", () => {
    const d = evaluateRun({
      checks: [bad("connectivity", "HTTP 503: Service Unavailable", 503), bad("completion", "HTTP 503", 503)],
      previous: null,
      config: CONFIG,
    });
    expect(d.health).toBe(HEALTH.UNKNOWN);
    expect(d.countsAsFailure).toBe(false);
  });

  it("rate limiting does not increment the failure counter", () => {
    const d = evaluateRun({
      checks: [bad("completion", "HTTP 429: Rate limit exceeded", 429)],
      previous: { health: HEALTH.PASS, consecutiveFailures: 1 },
      config: CONFIG,
    });
    expect(d.countsAsFailure).toBe(false);
    expect(d.patch.consecutiveFailures).toBeUndefined();
    expect(d.health).toBe(HEALTH.PASS);
  });

  it("100 accounts-wide auth failures in a row never quarantine a model", () => {
    let prev = { health: HEALTH.PASS, consecutiveFailures: 0, quarantineCount: 0 };
    for (let i = 0; i < 100; i++) {
      const d = evaluateRun({
        checks: [bad("completion", "HTTP 401: Incorrect API key provided", 401)],
        previous: prev,
        config: CONFIG,
      });
      prev = { ...prev, ...d.patch, health: d.health };
      expect(d.health).not.toBe(HEALTH.FAIL);
    }
    expect(prev.quarantined).toBeUndefined();
  });
});

describe("FAIL and suppression", () => {
  // A repeat-able model failure that is NOT definitive: an empty completion is a
  // real finding but can come back, so it must repeat before suppression.
  const modelFailure = [bad("completion", "HTTP 200: Provider returned no completion choices for this model", 200)];

  it("stays UNKNOWN below the threshold and counts the failure", () => {
    const d = evaluateRun({ checks: modelFailure, previous: null, config: CONFIG });
    expect(d.health).toBe(HEALTH.UNKNOWN);
    expect(d.countsAsFailure).toBe(true);
    expect(d.patch.consecutiveFailures).toBe(1);
    expect(d.patch.quarantined).toBeUndefined();
  });

  it("quarantines on the configured threshold", () => {
    const d = evaluateRun({
      checks: modelFailure,
      previous: { health: HEALTH.UNKNOWN, consecutiveFailures: 2 },
      config: CONFIG,
    });
    expect(d.health).toBe(HEALTH.FAIL);
    expect(d.patch.quarantined).toBe(true);
    expect(d.patch.quarantineCount).toBe(1);
    expect(d.patch.quarantinedUntil).toBeTruthy();
  });

  it("honours a custom threshold", () => {
    const d = evaluateRun({
      checks: modelFailure,
      previous: { health: HEALTH.UNKNOWN, consecutiveFailures: 0 },
      config: { ...CONFIG, failureThreshold: 1 },
    });
    expect(d.health).toBe(HEALTH.FAIL);
  });

  it("a definitively missing model fails immediately, without waiting for repeats", () => {
    const d = evaluateRun({
      checks: [bad("completion", "HTTP 404: No endpoints found for meta/ghost", 404)],
      previous: { health: HEALTH.UNKNOWN, consecutiveFailures: 0 },
      config: { ...CONFIG, failureThreshold: 10 },
    });
    expect(d.health).toBe(HEALTH.FAIL);
    expect(d.patch.quarantined).toBe(true);
  });

  it("never deletes the model — suppression only sets flags", () => {
    const d = evaluateRun({ checks: modelFailure, previous: { consecutiveFailures: 2 }, config: CONFIG });
    expect(d.patch.deleted).toBeUndefined();
    expect(d.patch.presentInCatalog).toBeUndefined();
  });
});

describe("cooldown and anti-flap", () => {
  it("backoff doubles per quarantine and is capped", () => {
    expect(backoffCooldownMs(1, CONFIG)).toBe(1000);
    expect(backoffCooldownMs(2, CONFIG)).toBe(2000);
    expect(backoffCooldownMs(3, CONFIG)).toBe(4000);
    expect(backoffCooldownMs(20, CONFIG)).toBe(60000);
  });

  it("cooldownExpired respects the stored timestamp", () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const future = new Date(Date.now() + 60000).toISOString();
    expect(cooldownExpired({ quarantinedUntil: past })).toBe(true);
    expect(cooldownExpired({ quarantinedUntil: future })).toBe(false);
    expect(cooldownExpired({})).toBe(true);
    expect(cooldownExpired({ quarantinedUntil: "not-a-date" })).toBe(true);
  });

  it("auto-retest stops after the configured budget", () => {
    expect(autoRetestAllowed({ quarantined: false }, CONFIG)).toBe(true);
    expect(autoRetestAllowed({ quarantined: true, quarantineCount: 1 }, CONFIG)).toBe(true);
    expect(autoRetestAllowed({ quarantined: true, quarantineCount: 3 }, CONFIG)).toBe(false);
  });
});

describe("recovery", () => {
  const quarantined = () => ({
    health: HEALTH.FAIL, quarantined: true, quarantineCount: 1,
    consecutiveFailures: 3, consecutivePasses: 0,
  });

  it("one good run is not enough — the model stays quarantined", () => {
    const d = evaluateRun({ checks: FULL_PASS, previous: quarantined(), config: CONFIG, recoveryRun: true });
    expect(d.health).toBe(HEALTH.FAIL);
    expect(d.patch.quarantined).toBeUndefined();
    expect(d.patch.consecutivePasses).toBe(1);
    expect(d.reason).toMatch(/recovery 1\/2/);
  });

  it("restores only after the configured number of consecutive passes", () => {
    const d = evaluateRun({
      checks: FULL_PASS,
      previous: { ...quarantined(), consecutivePasses: 1 },
      config: CONFIG,
      recoveryRun: true,
    });
    expect(d.health).toBe(HEALTH.PASS);
    expect(d.patch.quarantined).toBe(false);
    expect(d.patch.quarantinedUntil).toBeNull();
    expect(d.patch.consecutiveFailures).toBe(0);
  });

  it("restores as DEGRADED when a capability is still broken", () => {
    const d = evaluateRun({
      checks: [...FULL_PASS.slice(0, 5), bad("streaming", "no SSE content deltas were returned")],
      previous: { ...quarantined(), consecutivePasses: 1 },
      config: CONFIG,
      recoveryRun: true,
    });
    expect(d.health).toBe(HEALTH.DEGRADED);
    expect(d.patch.quarantined).toBe(false);
  });

  it("a failure during recovery resets the streak and stays quarantined", () => {
    let prev = quarantined();
    // pass, pass -> restored; now fail again -> straight back into quarantine
    const firstPass = evaluateRun({ checks: FULL_PASS, previous: prev, config: CONFIG, recoveryRun: true });
    expect(firstPass.patch.quarantined).toBeUndefined();
    const restored = evaluateRun({ checks: FULL_PASS, previous: { ...prev, consecutivePasses: 1 }, config: CONFIG, recoveryRun: true });
    expect(restored.patch.quarantined).toBe(false);
    prev = { ...prev, ...restored.patch, health: restored.health, quarantined: false, consecutiveFailures: 0 };
    const failed = evaluateRun({
      checks: [bad("completion", "HTTP 404: model not found", 404)],
      previous: prev,
      config: { ...CONFIG, failureThreshold: 1 },
    });
    expect(failed.patch.quarantined).toBe(true);
    expect(failed.patch.quarantineCount).toBe(2);
    // and the second quarantine waits longer
    expect(Date.parse(failed.patch.quarantinedUntil)).toBeGreaterThan(Date.now());
  });

  it("a mid-recovery failure does not release the model", () => {
    const d = evaluateRun({
      checks: [bad("completion", "HTTP 200: Provider returned no completion choices for this model", 200)],
      previous: { ...quarantined(), consecutivePasses: 1 },
      config: CONFIG,
      recoveryRun: true,
    });
    expect(d.health).toBe(HEALTH.FAIL);
    // A failure during recovery keeps the model quarantined and wipes the streak.
    expect(d.patch.quarantined).toBe(true);
    expect(d.patch.consecutivePasses).toBe(0);
    expect(d.patch.consecutiveFailures).toBe(4);
  });
});

describe("manual override", () => {
  it("FORCE_FAIL outranks a passing probe", () => {
    const d = evaluateRun({
      checks: FULL_PASS,
      previous: { health: HEALTH.PASS, manualOverride: OVERRIDE.FORCE_FAIL },
      config: CONFIG,
    });
    expect(d.health).toBe(HEALTH.FAIL);
    expect(d.patch.quarantined).toBe(true);
  });

  it("FORCE_PASS keeps a model visible through repeated model-scoped failures", () => {
    const d = evaluateRun({
      checks: [bad("completion", "HTTP 404: model not found", 404)],
      previous: { health: HEALTH.FAIL, manualOverride: OVERRIDE.FORCE_PASS, consecutiveFailures: 9 },
      config: CONFIG,
    });
    expect(d.health).toBe(HEALTH.PASS);
    expect(d.countsAsFailure).toBe(false);
  });
});

describe("latency accounting", () => {
  it("records the first observation then smooths it", () => {
    const first = evaluateRun({ checks: FULL_PASS, previous: null, config: CONFIG });
    expect(first.patch.avgLatencyMs).toBe(100);
    const second = evaluateRun({
      checks: FULL_PASS.map((c) => ({ ...c, latencyMs: 200 })),
      previous: { ...(first.patch), avgLatencyMs: 100 },
      config: CONFIG,
    });
    expect(second.patch.avgLatencyMs).toBe(130);
  });

  it("leaves the average alone when nothing was measured", () => {
    const d = evaluateRun({
      checks: FULL_PASS.map((c) => ({ ...c, latencyMs: null })),
      previous: { avgLatencyMs: 250 },
      config: CONFIG,
    });
    expect(d.patch.avgLatencyMs).toBe(250);
  });
});
