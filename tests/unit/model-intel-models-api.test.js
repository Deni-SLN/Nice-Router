// Phase 6: gateway compatibility.
// Exercises the REAL /v1/models route handler (not a reimplementation) against a
// real SQLite database, so the evidence covers id format, suppression, the admin
// full-catalog option and provider-alias resolution.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { HEALTH } from "@/lib/db/repos/modelIntelRepo.js";
import { PROVIDER_MODELS, PROVIDER_ID_TO_ALIAS } from "open-sse/config/providerModels.js";
import { parseModel } from "open-sse/services/model.js";

let tempDir;
const originalDataDir = process.env.DATA_DIR;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "9router-gw-"));
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

const req = (url = "http://localhost:20128/v1/models") => ({ url, headers: new Headers() });

describe("model id format is unchanged by the intelligence layer", () => {
  it("ids stay in provider/model form", () => {
    for (const [alias, models] of Object.entries(PROVIDER_MODELS)) {
      for (const m of models.slice(0, 3)) {
        const id = `${alias}/${m.id}`;
        const parsed = parseModel(id);
        expect(id).toContain("/");
        expect(parsed.isAlias).toBe(false);
        expect(parsed.model).toBe(m.id);
      }
    }
  });

  it("OpenRouter ids including ':free' survive a parse round trip", () => {
    const orModels = PROVIDER_MODELS[PROVIDER_ID_TO_ALIAS.openrouter] || [];
    const free = orModels.find((m) => m.id.endsWith(":free"));
    expect(free, "expected at least one :free OpenRouter model").toBeTruthy();
    const parsed = parseModel(`openrouter/${free.id}`);
    expect(parsed.provider).toBe("openrouter");
    // The ':free' suffix is part of the model id, not a separator 9router strips.
    expect(parsed.model).toBe(free.id);
    expect(parsed.model.endsWith(":free")).toBe(true);
  });

  it("every published alias/model id resolves to the provider that owns that list", () => {
    // PROVIDER_ID_TO_ALIAS is not a bijection (two registry entries share
    // aliases in both directions), so the contract to check is the one clients
    // actually depend on: the id /v1/models publishes routes to the provider
    // whose catalog listed it.
    let checked = 0;
    for (const [alias, models] of Object.entries(PROVIDER_MODELS)) {
      if (!models.length) continue;
      const sample = models[0];
      const parsed = parseModel(`${alias}/${sample.id}`);
      expect(parsed.isAlias).toBe(false);
      expect(parsed.model).toBe(sample.id);
      // The resolved provider must have this model in its own registry list.
      const providerList = PROVIDER_MODELS[PROVIDER_ID_TO_ALIAS[parsed.provider] || parsed.provider];
      expect(
        providerList?.some((m) => m.id === sample.id),
        `${alias}/${sample.id} resolved to ${parsed.provider}, which does not list it`
      ).toBe(true);
      checked++;
    }
    expect(checked).toBeGreaterThan(50);
  });
});

describe("GET /v1/models suppression", () => {
  // A provider with real LLM entries: OpenRouter's static list is media-only and
  // relies on passthroughModels, so it would never reach the LLM /v1/models list.
  const PROVIDER = "anthropic";
  const ALIAS = PROVIDER_ID_TO_ALIAS[PROVIDER] || PROVIDER;

  async function seedQuarantine() {
    const repo = await import("@/lib/db/repos/modelIntelRepo.js");
    const models = PROVIDER_MODELS[ALIAS] || [];
    const target = models[0];
    const keeper = models[1];
    await repo.upsertDiscoveredModel({ provider: PROVIDER, model: target.id, name: target.name });
    await repo.upsertDiscoveredModel({ provider: PROVIDER, model: keeper.id, name: keeper.name });
    await repo.updateModelIntelState(PROVIDER, target.id, {
      health: HEALTH.FAIL, quarantined: true, quarantineCount: 1,
    });
    return { provider: PROVIDER, alias: ALIAS, target, keeper, targetId: `${ALIAS}/${target.id}`, keeperId: `${ALIAS}/${keeper.id}` };
  }

  it("hides a quarantined model, keeps its neighbour, and preserves the id format", async () => {
    const seed = await seedQuarantine();
    const { GET } = await import("@/app/api/v1/models/route.js");
    const { updateIntelConfig } = await import("@/lib/intelligence/config.js");
    await updateIntelConfig({ hideFailedFromModelsList: true });

    const unfiltered = (await (await GET(req("http://localhost:20128/v1/models?full=1"))).json()).data.map((m) => m.id);
    // Guard: the fixture must actually be present, or this test proves nothing.
    expect(unfiltered, `${seed.alias} fixture missing from the catalog`).toContain(seed.targetId);

    const filtered = (await (await GET(req())).json()).data.map((m) => m.id);
    expect(filtered).not.toContain(seed.targetId);
    expect(filtered).toContain(seed.keeperId);
    expect(filtered.length).toBe(unfiltered.length - 1);
    // Everyone that survives keeps the exact same id format.
    expect(filtered.every((id) => typeof id === "string" && id.includes("/"))).toBe(true);
  });

  it("?full=1 returns the unfiltered catalog for administrative callers", async () => {
    await seedQuarantine();
    const { GET } = await import("@/app/api/v1/models/route.js");
    const { updateIntelConfig } = await import("@/lib/intelligence/config.js");
    await updateIntelConfig({ hideFailedFromModelsList: true });

    const filtered = (await (await GET(req())).json()).data.map((m) => m.id);
    const full = (await (await GET(req("http://localhost:20128/v1/models?full=1"))).json()).data.map((m) => m.id);

    expect(full.length).toBeGreaterThan(filtered.length);
    for (const id of filtered) expect(full).toContain(id);
  });

  it("a manual override puts a quarantined model back in the list", async () => {
    const seed = await seedQuarantine();
    const { GET } = await import("@/app/api/v1/models/route.js");
    const { setModelOverride } = await import("@/lib/intelligence/override.js");
    const { updateIntelConfig } = await import("@/lib/intelligence/config.js");
    const { OVERRIDE } = await import("@/lib/db/repos/modelIntelRepo.js");
    await updateIntelConfig({ hideFailedFromModelsList: true });

    expect((await (await GET(req())).json()).data.map((m) => m.id)).not.toContain(seed.targetId);
    await setModelOverride(seed.provider, seed.target.id, OVERRIDE.FORCE_PASS);
    expect((await (await GET(req())).json()).data.map((m) => m.id)).toContain(seed.targetId);
  });

  it("restore releases a quarantined model back into the default list", async () => {
    const seed = await seedQuarantine();
    const { GET } = await import("@/app/api/v1/models/route.js");
    const { restoreModel } = await import("@/lib/intelligence/override.js");
    const { updateIntelConfig } = await import("@/lib/intelligence/config.js");
    await updateIntelConfig({ hideFailedFromModelsList: true });

    expect((await (await GET(req())).json()).data.map((m) => m.id)).not.toContain(seed.targetId);
    await restoreModel(seed.provider, seed.target.id);
    expect((await (await GET(req())).json()).data.map((m) => m.id)).toContain(seed.targetId);
  });

  it("turning the feature off returns the untouched list", async () => {
    const seed = await seedQuarantine();
    const { GET } = await import("@/app/api/v1/models/route.js");
    const { updateIntelConfig } = await import("@/lib/intelligence/config.js");

    await updateIntelConfig({ hideFailedFromModelsList: false });
    expect((await (await GET(req())).json()).data.map((m) => m.id)).toContain(seed.targetId);
  });

  it("fails open when the intelligence layer cannot answer", async () => {
    const { applyModelsListEligibility } = await import("@/lib/intelligence/gateway.js");
    const models = [{ id: "openrouter/a" }, { id: "openrouter/b" }];
    const result = await applyModelsListEligibility(models, {});
    expect(result.models).toBe(models);
  });


  it("response shape is still OpenAI-compatible", async () => {
    const { GET } = await import("@/app/api/v1/models/route.js");
    const body = await (await GET(req())).json();
    expect(body.object).toBe("list");
    expect(Array.isArray(body.data)).toBe(true);
    for (const m of body.data.slice(0, 20)) {
      expect(typeof m.id).toBe("string");
      expect(m.object).toBe("model");
      expect(typeof m.owned_by).toBe("string");
    }
  });

  it("capabilities and context length are still published", async () => {
    const { GET } = await import("@/app/api/v1/models/route.js");
    const body = await (await GET(req())).json();
    const withCaps = body.data.filter((m) => m.capabilities);
    expect(withCaps.length).toBeGreaterThan(0);
    expect(withCaps[0].capabilities.contextWindow).toBeGreaterThan(0);
  });
});

describe("wantsFullCatalog", () => {
  it("only accepts an explicit administrative flag", async () => {
    const { wantsFullCatalog } = await import("@/lib/intelligence/gateway.js");
    expect(wantsFullCatalog(req("http://x/v1/models?full=1"))).toBe(true);
    expect(wantsFullCatalog(req("http://x/v1/models?full=true"))).toBe(true);
    expect(wantsFullCatalog(req("http://x/v1/models"))).toBe(false);
    expect(wantsFullCatalog(req("http://x/v1/models?full=0"))).toBe(false);
    expect(wantsFullCatalog(req("http://x/v1/models?full=yes"))).toBe(false);
    expect(wantsFullCatalog({})).toBe(false);
    expect(wantsFullCatalog(null)).toBe(false);
  });
});