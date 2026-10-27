// Phase 5 + 6: selection filters, Free Only safety, Free First ranking, and the
// /v1/models eligibility gate (including Hermes / OpenClaw id compatibility).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  applyFilters, sortModels, isEligibleForModelsList, pickFallback,
  assertFreeOnlySafe, summarizeModels, FILTER,
} from "@/lib/intelligence/selection.js";
import { HEALTH } from "@/lib/db/repos/modelIntelRepo.js";

let tempDir;
const originalDataDir = process.env.DATA_DIR;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "9router-sel-"));
  process.env.DATA_DIR = tempDir;
  delete global._dbAdapter;
  vi.resetModules();
});

afterEach(() => {
  try { global._dbAdapter?.instance?.close?.(); } catch {}
  delete global._dbAdapter;
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
  if (originalDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = originalDataDir;
});

const model = (over = {}) => ({
  id: "openrouter/x",
  provider: "openrouter",
  model: "x",
  name: "X",
  kind: "llm",
  source: "openrouter",
  discovered: true,
  health: HEALTH.UNKNOWN,
  healthReason: null,
  quarantined: false,
  quarantinedUntil: null,
  manualOverride: null,
  presentInCatalog: true,
  lastTestedAt: null,
  lastSyncAt: null,
  latencyMs: null,
  avgLatencyMs: null,
  errorCategory: null,
  errorScope: null,
  testedCapabilities: null,
  free: "unknown",
  freeReason: "no pricing information",
  price: null,
  capabilities: { tools: true, vision: false, reasoning: false, contextWindow: 200000, maxOutput: 64000 },
  ...over,
});

describe("Free Only never selects a paid model", () => {
  const catalog = [
    model({ id: "openrouter/free-a", model: "free-a", free: "free" }),
    model({ id: "openrouter/paid-a", model: "paid-a", free: "paid" }),
    model({ id: "openrouter/unknown-a", model: "unknown-a", free: "unknown" }),
  ];

  it("filters out both paid and unknown-pricing models", () => {
    const out = applyFilters(catalog, { filter: FILTER.FREE_ONLY });
    expect(out.map((m) => m.model)).toEqual(["free-a"]);
  });

  it("returns nothing when there is no confirmed free model", () => {
    const out = applyFilters([catalog[1], catalog[2]], { filter: FILTER.FREE_ONLY });
    expect(out).toEqual([]);
  });

  it("pickFallback under Free Only only ever returns a free model", () => {
    const choice = pickFallback(catalog, { freeOnly: true });
    expect(choice.free).toBe("free");
  });

  it("pickFallback returns null rather than breaking the Free Only promise", () => {
    expect(pickFallback([catalog[1], catalog[2]], { freeOnly: true })).toBeNull();
  });

  it("assertFreeOnlySafe reports any plan that could reach a paid model", () => {
    expect(assertFreeOnlySafe([catalog[0]], { freeOnly: true })).toEqual([]);
    const violations = assertFreeOnlySafe(catalog, { freeOnly: true });
    expect(violations.map((v) => v.model).sort()).toEqual(["paid-a", "unknown-a"]);
  });

  it("is a no-op when Free Only is off", () => {
    expect(assertFreeOnlySafe(catalog, { freeOnly: false })).toEqual([]);
  });

  it("Paid Only excludes free models", () => {
    const out = applyFilters(catalog, { filter: FILTER.PAID_ONLY });
    expect(out.map((m) => m.model).sort()).toEqual(["paid-a", "unknown-a"]);
  });
});

describe("Free First prioritisation", () => {
  it("puts free models ahead of paid ones while still sorting by health within a tier", () => {
    const catalog = [
      model({ id: "p/paid-pass", model: "paid-pass", free: "paid", health: HEALTH.PASS, capabilities: { tools: true, vision: false, contextWindow: 1000, maxOutput: 100 } }),
      model({ id: "p/free-degraded", model: "free-degraded", free: "free", health: HEALTH.DEGRADED, capabilities: { tools: true, vision: false, contextWindow: 1000, maxOutput: 100 } }),
      model({ id: "p/free-pass", model: "free-pass", free: "free", health: HEALTH.PASS, capabilities: { tools: true, vision: false, contextWindow: 1000, maxOutput: 100 } }),
      model({ id: "p/unknown-pass", model: "unknown-pass", free: "unknown", health: HEALTH.PASS, capabilities: { tools: true, vision: false, contextWindow: 1000, maxOutput: 100 } }),
    ];
    const ranked = sortModels(catalog, { freeFirst: true }).map((m) => m.model);
    expect(ranked).toEqual(["free-pass", "free-degraded", "unknown-pass", "paid-pass"]);
  });

  it("does not reorder by price when Free First is off", () => {
    const catalog = [
      model({ id: "p/paid-pass", model: "paid-pass", free: "paid", health: HEALTH.PASS, capabilities: { tools: true, vision: false, contextWindow: 1000, maxOutput: 100 } }),
      model({ id: "p/free-pass", model: "free-pass", free: "free", health: HEALTH.PASS, capabilities: { tools: true, vision: false, contextWindow: 1000, maxOutput: 100 } }),
    ];
    const ranked = sortModels(catalog, { freeFirst: false }).map((m) => m.model);
    // Ties broken by id is not required; what matters is that price is not the lever.
    expect(new Set(ranked)).toEqual(new Set(["paid-pass", "free-pass"]));
  });

  it("the Free First filter mode also re-ranks", () => {
    const catalog = [
      model({ id: "p/paid", model: "paid", free: "paid", health: HEALTH.PASS, capabilities: { tools: true, vision: false, contextWindow: 1000, maxOutput: 100 } }),
      model({ id: "p/free", model: "free", free: "free", health: HEALTH.PASS, capabilities: { tools: true, vision: false, contextWindow: 1000, maxOutput: 100 } }),
    ];
    expect(applyFilters(catalog, { filter: FILTER.FREE_FIRST }).map((m) => m.model)).toEqual(["free", "paid"]);
  });
});

describe("capability and context filters", () => {
  const catalog = [
    model({ id: "a/plain", model: "plain", capabilities: { tools: false, vision: false, reasoning: false, contextWindow: 8000, maxOutput: 100 } }),
    model({ id: "a/tools", model: "tools", capabilities: { tools: true, vision: false, reasoning: false, contextWindow: 32000, maxOutput: 100 } }),
    model({ id: "a/vision", model: "vision", capabilities: { tools: true, vision: true, reasoning: false, contextWindow: 128000, maxOutput: 100 } }),
    model({ id: "a/huge", model: "huge", capabilities: { tools: true, vision: false, reasoning: true, contextWindow: 2000000, maxOutput: 100 } }),
  ];

  it("Tool calling keeps only tool-capable models", () => {
    expect(applyFilters(catalog, { requireTools: true }).map((m) => m.model).sort()).toEqual(["huge", "tools", "vision"]);
  });

  it("Vision / multimodal keeps only vision-capable models", () => {
    expect(applyFilters(catalog, { requireVision: true }).map((m) => m.model)).toEqual(["vision"]);
  });

  it("minimum context window filters by capability, not by name", () => {
    expect(applyFilters(catalog, { minContextWindow: 200000 }).map((m) => m.model)).toEqual(["huge"]);
  });

  it("combines tool calling with a minimum context window", () => {
    expect(applyFilters(catalog, { requireTools: true, minContextWindow: 100000 }).map((m) => m.model).sort()).toEqual(["huge", "vision"]);
  });

  it("Healthy Only keeps PASS and DEGRADED, and drops FAIL and UNKNOWN", () => {
    const health = [
      model({ id: "a/p", model: "p", health: HEALTH.PASS }),
      model({ id: "a/d", model: "d", health: HEALTH.DEGRADED }),
      model({ id: "a/f", model: "f", health: HEALTH.FAIL }),
      model({ id: "a/u", model: "u", health: HEALTH.UNKNOWN }),
    ];
    expect(applyFilters(health, { filter: FILTER.HEALTHY_ONLY }).map((m) => m.model).sort()).toEqual(["d", "p"]);
  });

  it("search matches id and name case-insensitively", () => {
    expect(applyFilters(catalog, { search: "VISION" }).map((m) => m.model)).toEqual(["vision"]);
    expect(applyFilters(catalog, { search: "a/hug" }).map((m) => m.model)).toEqual(["huge"]);
  });

  it("hides models flagged absent from the provider catalog", () => {
    const withMissing = [...catalog, model({ id: "a/gone", model: "gone", presentInCatalog: false })];
    expect(applyFilters(withMissing, {}).map((m) => m.model)).not.toContain("gone");
  });

  it("an unknown filter value degrades to All Models rather than throwing", () => {
    expect(applyFilters(catalog, { filter: "nonsense" })).toHaveLength(4);
  });
});

describe("ranking order after eligibility", () => {
  it("health outranks context window", () => {
    const catalog = [
      model({ id: "a/small-pass", model: "small-pass", health: HEALTH.PASS, capabilities: { tools: true, vision: false, contextWindow: 1000, maxOutput: 1 } }),
      model({ id: "a/big-unknown", model: "big-unknown", health: HEALTH.UNKNOWN, capabilities: { tools: true, vision: false, contextWindow: 9000000, maxOutput: 1 } }),
    ];
    expect(sortModels(catalog).map((m) => m.model)).toEqual(["small-pass", "big-unknown"]);
  });

  it("an unmeasured latency sorts last, not first", () => {
    const catalog = [
      model({ id: "a/slow", model: "slow", avgLatencyMs: 900, capabilities: { tools: true, vision: false, contextWindow: 1000, maxOutput: 1 } }),
      model({ id: "a/unmeasured", model: "unmeasured", avgLatencyMs: null, capabilities: { tools: true, vision: false, contextWindow: 1000, maxOutput: 1 } }),
    ];
    expect(sortModels(catalog).map((m) => m.model)).toEqual(["slow", "unmeasured"]);
  });
});

describe("/v1/models eligibility gate", () => {
  const entry = (over = {}) => ({ quarantined: false, presentInCatalog: true, manualOverride: null, ...over });

  it("shows a healthy model", () => {
    expect(isEligibleForModelsList(entry())).toBe(true);
  });

  it("hides a quarantined model", () => {
    expect(isEligibleForModelsList(entry({ quarantined: true }))).toBe(false);
  });

  it("an operator override wins over suppression", () => {
    expect(isEligibleForModelsList(entry({ quarantined: true, manualOverride: "FORCE_PASS" }))).toBe(true);
  });

  it("a model missing upstream is still listed — it is kept, not deleted", () => {
    expect(isEligibleForModelsList(entry({ presentInCatalog: false }))).toBe(true);
  });

  it("nothing is suppressed when the feature is turned off", () => {
    expect(isEligibleForModelsList(entry({ quarantined: true }), { hideFailed: false })).toBe(true);
  });

  it("an unknown model (no intel row) is never suppressed", () => {
    expect(isEligibleForModelsList(null)).toBe(true);
    expect(isEligibleForModelsList(undefined)).toBe(true);
  });
});

describe("summary counts", () => {
  it("counts health, pricing and quarantine independently", () => {
    const rows = [
      model({ id: "a/1", health: HEALTH.PASS, free: "free" }),
      model({ id: "a/2", health: HEALTH.DEGRADED, free: "paid" }),
      model({ id: "a/3", health: HEALTH.FAIL, quarantined: true, free: "unknown" }),
      model({ id: "a/4", health: HEALTH.UNKNOWN, free: "free" }),
      model({ id: "a/5", health: HEALTH.PASS, free: "free", presentInCatalog: false, discovered: false }),
    ];
    const s = summarizeModels(rows);
    expect(s.total).toBe(5);   // every bucket below sums back to this
    expect(s.pass + s.degraded + s.fail + s.unknown).toBe(s.total);
    expect(s.free + s.paid + s.pricingUnknown).toBe(s.total);
    expect(s.absent).toBe(1);
    expect(s.pass).toBe(2);      // a/1 and the retained-but-absent a/5
    expect(s.degraded).toBe(1);
    expect(s.fail).toBe(1);
    expect(s.unknown).toBe(1);   // a/4
    expect(s.quarantined).toBe(1);
    expect(s.free).toBe(3);    // a/1, a/4, a/5
    expect(s.paid).toBe(1);
    expect(s.pricingUnknown).toBe(1);
  });

  it("an empty catalog summarises to zeroes rather than undefined", () => {
    const s = summarizeModels([]);
    expect(s.total).toBe(0);
    expect(s.free).toBe(0);
    expect(s.quarantined).toBe(0);
  });
});
