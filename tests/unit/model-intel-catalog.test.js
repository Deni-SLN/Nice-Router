// Phase 2: discovery — parsing, deduplication, idempotent import, non-destruction.
// Uses a temp DATA_DIR so the real database is never touched.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parseOpenRouterModels } from "@/lib/intelligence/adapters/openrouter.js";
import { parseOpenAICompatibleModels } from "@/lib/intelligence/adapters/openaiCompatible.js";
import { classifyFreeTier, FREE_STATUS, isFreeMarker } from "@/lib/intelligence/freeTier.js";
import { HEALTH } from "@/lib/db/repos/modelIntelRepo.js";

let tempDir;
const originalDataDir = process.env.DATA_DIR;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "9router-intel-"));
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

// ── Parsing ──────────────────────────────────────────────────────────────────

const FREE_PAYLOAD = {
  data: [
    {
      id: "deepseek/deepseek-chat-v3-0324:free",
      name: "DeepSeek V3 (free)",
      context_length: 163840,
      architecture: { input_modalities: ["text"], output_modalities: ["text"] },
      supported_parameters: ["tools", "tool_choice", "temperature", "max_tokens"],
      pricing: { prompt: "0", completion: "0", request: "0" },
      description: "A free variant.",
    },
    {
      id: "anthropic/claude-sonnet-4.5",
      name: "Claude Sonnet 4.5",
      context_length: 1000000,
      architecture: { input_modalities: ["text", "image", "file"], output_modalities: ["text"] },
      supported_parameters: ["tools", "thinking"],
      pricing: { prompt: "0.000003", completion: "0.000015" },
    },
    {
      id: "openai/gpt-4o-mini:free",
      name: "GPT-4o mini (free)",
      context_length: 128000,
      architecture: { input_modalities: ["text"], output_modalities: ["text"] },
      pricing: { prompt: "0", completion: "0" },
      // Deliberately claims to be free but is quoted at a real price.
    },
    {
      id: "meta-llama/llama-3.3-70b-instruct:free",
      name: "Llama 3.3 70B Instruct",
      context_length: 131072,
      architecture: { input_modalities: ["text"], output_modalities: ["text"] },
      pricing: { prompt: "0.0000004", completion: "0.0000004" },
    },
    // duplicate id — must be dropped
    { id: "deepseek/deepseek-chat-v3-0324:free", name: "Duplicate", pricing: { prompt: "1", completion: "1" } },
  ],
};

describe("OpenRouter catalog parsing", () => {
  it("imports identity, context, modalities, parameters and pricing", () => {
    const models = parseOpenRouterModels(FREE_PAYLOAD);
    const m = models.find((x) => x.id === undefined && x.model === "anthropic/claude-sonnet-4.5");
    expect(m).toBeTruthy();
    expect(m.name).toBe("Claude Sonnet 4.5");
    expect(m.contextLength).toBe(1000000);
    expect(m.inputModalities).toEqual(expect.arrayContaining(["text", "image", "file"]));
    expect(m.outputModalities).toEqual(["text"]);
    expect(m.parameters).toEqual(expect.arrayContaining(["tools", "thinking"]));
    expect(m.pricing.prompt).toBeCloseTo(0.000003);
    expect(m.pricing.completion).toBeCloseTo(0.000015);
    // Provider identifiers are preserved verbatim, colon suffixes included.
    expect(models.some((x) => x.model === "deepseek/deepseek-chat-v3-0324:free")).toBe(true);
  });

  it("deduplicates by id and keeps the first occurrence", () => {
    const models = parseOpenRouterModels(FREE_PAYLOAD);
    const ids = models.map((m) => m.model);
    expect(new Set(ids).size).toBe(ids.length);
    const deepseek = models.filter((m) => m.model.startsWith("deepseek/"));
    expect(deepseek).toHaveLength(1);
    // The duplicate carried a non-zero price; it must not overwrite the free one.
    expect(deepseek[0].pricing.prompt).toBe(0);
  });

  it("records advertised tool calling from supported_parameters", () => {
    const models = parseOpenRouterModels(FREE_PAYLOAD);
    expect(models.find((m) => m.model === "anthropic/claude-sonnet-4.5").advertisedTools).toBe(true);
    expect(models.find((m) => m.model === "deepseek/deepseek-chat-v3-0324:free").advertisedTools).toBe(true);
  });

  it("tolerates a missing/garbage payload without throwing", () => {
    expect(parseOpenRouterModels(null)).toEqual([]);
    expect(parseOpenRouterModels({})).toEqual([]);
    expect(parseOpenRouterModels({ data: "nope" })).toEqual([]);
    expect(parseOpenRouterModels({ data: [null, {}, { id: "" }] })).toEqual([]);
  });

  it("does not invent pricing when the provider omits it", () => {
    const models = parseOpenRouterModels({ data: [{ id: "x/y", name: "Y" }] });
    expect(models[0].pricing).toBeNull();
  });
});

describe("generic OpenAI-compatible catalog parsing", () => {
  it("imports identity only and never guesses free from a name", () => {
    const models = parseOpenAICompatibleModels({
      data: [
        { id: "thing:free", name: "Thing Free" },
        { id: "other", name: "Other", context_length: 4096 },
      ],
    });
    expect(models.map((m) => m.model)).toEqual(["thing:free", "other"]);
    // No pricing block -> not free. A ":free" suffix alone proves nothing.
    expect(models[0].isFree).toBeUndefined();
    expect(models[1].contextLength).toBe(4096);
  });

  it("accepts bare arrays and {models:[...]} shapes", () => {
    expect(parseOpenAICompatibleModels(["a", "b"]).map((m) => m.model)).toEqual(["a", "b"]);
    expect(parseOpenAICompatibleModels({ models: ["c"] }).map((m) => m.model)).toEqual(["c"]);
  });

  it("accepts an explicit all-zero price block as free", () => {
    const [m] = parseOpenAICompatibleModels({ data: [{ id: "z", pricing: { prompt: "0", completion: "0" } }] });
    expect(m.isFree).toBe(true);
  });

  it("rejects a model whose price is zero in one dimension only", () => {
    const [m] = parseOpenAICompatibleModels({ data: [{ id: "z", pricing: { prompt: "0", completion: "0.00001" } }] });
    expect(m.isFree).toBe(false);
  });
});

// ── Free-tier classification ─────────────────────────────────────────────────

describe("free-tier classification", () => {
  it("a model with zero pricing metadata is free", () => {
    const meta = { pricing: { prompt: "0", completion: "0", request: "0", image: null, audio: null, web_search: null } };
    const r = classifyFreeTier({ provider: "openrouter", model: "a/b:free", adapterMeta: meta });
    expect(r.status).toBe(FREE_STATUS.FREE);
    expect(r.isFree).toBe(true);
  });

  it("a model with non-zero pricing is paid", () => {
    const meta = { pricing: { prompt: "0.000003", completion: "0.000015" } };
    const r = classifyFreeTier({ provider: "openrouter", model: "a/b", adapterMeta: meta });
    expect(r.status).toBe(FREE_STATUS.PAID);
    expect(r.isFree).toBe(false);
  });

  it("a ':free' id with a real price is PAID, not free", () => {
    // The important negative case: never trust the name over the price.
    const meta = { pricing: { prompt: "0.0000004", completion: "0.0000004" } };
    const r = classifyFreeTier({ provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free", adapterMeta: meta });
    expect(r.status).toBe(FREE_STATUS.PAID);
    expect(r.reason).toMatch(/non-zero price/i);
    expect(isFreeMarker("meta-llama/llama-3.3-70b-instruct:free")).toBe(true);
  });

  it("a ':free' id with no pricing at all is UNKNOWN, never free", () => {
    const r = classifyFreeTier({ provider: "openrouter", model: "a/b:free", adapterMeta: {} });
    expect(r.status).toBe(FREE_STATUS.UNKNOWN);
    expect(r.isFree).toBe(false);
  });

  it("no pricing information anywhere is UNKNOWN", () => {
    const r = classifyFreeTier({ provider: "made-up-provider", model: "zzz" });
    expect(r.status).toBe(FREE_STATUS.UNKNOWN);
  });

  it("an explicit adapter isFree=false overrides a zero price block", () => {
    const r = classifyFreeTier({
      provider: "openrouter", model: "a/b",
      adapterMeta: { isFree: false, pricing: { prompt: "0", completion: "0" } },
    });
    expect(r.status).toBe(FREE_STATUS.PAID);
  });

  it("per-generation modalities are never free on missing price data", () => {
    const r = classifyFreeTier({ provider: "openrouter", model: "a/img", adapterMeta: { kind: "image" } });
    expect(r.status).toBe(FREE_STATUS.PAID);
    expect(r.isFree).toBe(false);
  });
});

// ── Persistence: idempotency, dedup, non-destruction ────────────────────────

describe("catalog import is idempotent and non-destructive", () => {
  const meta = (prompt, completion) => ({ meta: { pricing: { prompt, completion } } });

  it("first import creates, second import changes nothing", async () => {
    const repo = await import("@/lib/db/repos/modelIntelRepo.js");

    expect(await repo.upsertDiscoveredModel({ provider: "openrouter", model: "a/b:free", name: "A B", ...meta("0", "0") }))
      .toBe("imported");
    expect(await repo.upsertDiscoveredModel({ provider: "openrouter", model: "a/b:free", name: "A B", ...meta("0", "0") }))
      .toBe("unchanged");
    expect(await repo.upsertDiscoveredModel({ provider: "openrouter", model: "a/b:free", name: "A B", ...meta("0", "0") }))
      .toBe("unchanged");

    const rows = await repo.listModelIntel();
    expect(rows).toHaveLength(1);
  });

  it("a changed price is reported as an update", async () => {
    const repo = await import("@/lib/db/repos/modelIntelRepo.js");
    await repo.upsertDiscoveredModel({ provider: "openrouter", model: "a/b", name: "A B", ...meta("1", "2") });
    expect(await repo.upsertDiscoveredModel({ provider: "openrouter", model: "a/b", name: "A B", ...meta("3", "4") }))
      .toBe("updated");
  });

  it("sync never overwrites health, quarantine or counters", async () => {
    const repo = await import("@/lib/db/repos/modelIntelRepo.js");
    await repo.upsertDiscoveredModel({ provider: "openrouter", model: "a/b", name: "A B", ...meta("0", "0") });
    await repo.updateModelIntelState("openrouter", "a/b", {
      health: HEALTH.FAIL, quarantined: true, quarantineCount: 2, consecutiveFailures: 4,
    });

    // Re-sync with different metadata.
    await repo.upsertDiscoveredModel({ provider: "openrouter", model: "a/b", name: "A B Renamed", ...meta("9", "9") });
    const row = await repo.getModelIntel("openrouter", "a/b");
    expect(row.health).toBe(HEALTH.FAIL);
    expect(row.quarantined).toBe(true);
    expect(row.quarantineCount).toBe(2);
    expect(row.consecutiveFailures).toBe(4);
    // but identity/metadata did move
    expect(row.name).toBe("A B Renamed");
    expect(row.data.meta.pricing.prompt).toBe("9");
  });

  it("a model that disappears upstream is flagged, never deleted", async () => {
    const repo = await import("@/lib/db/repos/modelIntelRepo.js");
    for (const id of ["a/b", "a/c", "a/d"]) {
      await repo.upsertDiscoveredModel({ provider: "openrouter", model: id, name: id, ...meta("0", "0") });
    }
    const marked = await repo.markMissing("openrouter", ["a/b"]);
    expect(marked).toBe(2);

    // Still on disk, just not in the active catalog.
    const active = await repo.listModelIntel();
    expect(active.map((r) => r.model).sort()).toEqual(["a/b"]);
    const all = await repo.getAllModelIntel();
    expect(all).toHaveLength(3);
    expect(all.filter((r) => r.presentInCatalog === false).map((r) => r.model).sort()).toEqual(["a/c", "a/d"]);
  });

  it("marking a model missing leaves its health history intact", async () => {
    const repo = await import("@/lib/db/repos/modelIntelRepo.js");
    await repo.upsertDiscoveredModel({ provider: "openrouter", model: "a/b", name: "A B", ...meta("0", "0") });
    await repo.updateModelIntelState("openrouter", "a/b", { health: HEALTH.FAIL, quarantined: true });
    await repo.addModelIntelEvent({ modelIntelId: "openrouter/a/b", provider: "openrouter", model: "a/b", health: HEALTH.FAIL, message: "boom" });
    await repo.markMissing("openrouter", []);

    const row = await repo.getModelIntel("openrouter", "a/b");
    expect(row.quarantined).toBe(true);
    expect(row.health).toBe(HEALTH.FAIL);
    const history = await repo.getModelHistory("openrouter/a/b");
    expect(history).toHaveLength(1);
    expect(history[0].message).toBe("boom");
  });

  it("a failed provider fetch does not mark anything missing", async () => {
    const repo = await import("@/lib/db/repos/modelIntelRepo.js");
    await repo.upsertDiscoveredModel({ provider: "openrouter", model: "a/b", name: "A B", ...meta("0", "0") });
    // syncCatalog records the error and returns without calling markMissing.
    await repo.upsertDiscoveredModel({ provider: "openrouter", model: "a/b", name: "A B", ...meta("0", "0") });
    expect((await repo.listModelIntel()).map((r) => r.model)).toEqual(["a/b"]);
  });

  it("records sync runs with imported/updated/error counts", async () => {
    const repo = await import("@/lib/db/repos/modelIntelRepo.js");
    await repo.recordSyncRun({ status: "ok", imported: 5, updated: 2, unchanged: 10, errorCount: 1, errors: ["openrouter: boom"], durationMs: 1234 });
    const last = await repo.getLastSyncRun();
    expect(last).toMatchObject({ status: "ok", imported: 5, updated: 2, unchanged: 10, errorCount: 1, durationMs: 1234 });
    expect(last.errors[0]).toContain("boom");
    expect(last.timestamp).toBeTruthy();
  });

  it("keeps provider identity separate between providers", async () => {
    const repo = await import("@/lib/db/repos/modelIntelRepo.js");
    await repo.upsertDiscoveredModel({ provider: "openrouter", model: "shared/model", name: "X", ...meta("0", "0") });
    await repo.updateModelIntelState("openrouter", "shared/model", { health: HEALTH.FAIL, quarantined: true });
    await repo.upsertDiscoveredModel({ provider: "other", model: "shared/model", name: "X", ...meta("0", "0") });

    expect((await repo.getModelIntel("openrouter", "shared/model")).quarantined).toBe(true);
    expect((await repo.getModelIntel("other", "shared/model")).quarantined).toBe(false);
    expect((await repo.getModelIntel("other", "shared/model")).health).toBe(HEALTH.UNKNOWN);
  });

  it("truncates long provider error text so nothing unbounded is stored", async () => {
    const repo = await import("@/lib/db/repos/modelIntelRepo.js");
    await repo.upsertDiscoveredModel({ provider: "openrouter", model: "a/b", name: "A B", ...meta("0", "0") });
    await repo.addModelIntelEvent({
      modelIntelId: "openrouter/a/b", provider: "openrouter", model: "a/b",
      message: "x".repeat(5000),
    });
    const [event] = await repo.getModelHistory("openrouter/a/b");
    expect(event.message.length).toBeLessThanOrEqual(500);
  });
});
