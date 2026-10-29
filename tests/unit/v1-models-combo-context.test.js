import { describe, expect, it, vi } from "vitest";
import { setCatalogSource } from "../../open-sse/providers/capabilities.js";

const db = vi.hoisted(() => ({
  getProviderConnections: vi.fn(),
  getCombos: vi.fn(),
  getCustomModels: vi.fn(async () => []),
  getModelAliases: vi.fn(async () => ({})),
}));

vi.mock("@/lib/localDb", () => db);
vi.mock("@/lib/disabledModelsDb", () => ({
  getDisabledModels: vi.fn(async () => ({})),
}));

const { buildModelsList } = await import("../../src/app/api/v1/models/route.js");

const syncedLimits = { contextWindow: 180000, maxOutput: 16000 };

async function modelsWithCombo(providerId, modelId, combos) {
  db.getProviderConnections.mockResolvedValue([{
    id: 1,
    provider: providerId,
    isActive: true,
    providerSpecificData: { enabledModels: [modelId] },
  }]);
  db.getCombos.mockResolvedValue(combos);
  setCatalogSource({
    getModalities: () => null,
    getLimits: (provider, model) =>
      provider === providerId && model === modelId ? syncedLimits : null,
  });
  try {
    return await buildModelsList(["llm"]);
  } finally {
    setCatalogSource(null);
  }
}

describe("/v1/models combo limits", () => {
  it.each([
    ["ocg", "opencode-go", "mimo-v2.5"],
    ["xmtp", "xiaomi-tokenplan", "mimo-v2.5"],
    ["ps", "poolside", "custom-model"],
    ["ds", "deepseek", "deepseek-chat"],
  ])("uses the real provider for a %s UI-alias seat", async (uiAlias, providerId, modelId) => {
    const combo = { name: "ui-alias-combo", models: [`${uiAlias}/${modelId}`] };
    const models = await modelsWithCombo(providerId, modelId, [combo]);
    const published = models.find((model) => model.id === combo.name);

    expect(published).toMatchObject({
      context_length: 180000,
      max_completion_tokens: 16000,
      capabilities: { contextWindow: 180000, maxOutput: 16000 },
    });
  });

  it("carries provider-scoped limits through a nested combo", async () => {
    const models = await modelsWithCombo("opencode-go", "mimo-v2.5", [
      { name: "inner-combo", models: ["ocg/mimo-v2.5"] },
      { name: "outer-combo", models: ["inner-combo"] },
    ]);
    const outer = models.find((model) => model.id === "outer-combo");

    expect(outer).toMatchObject({
      context_length: 180000,
      max_completion_tokens: 16000,
      capabilities: { contextWindow: 180000, maxOutput: 16000 },
    });
  });

  it("publishes Devin CLI's 200k limit for a dv combo seat", async () => {
    const models = await modelsWithCombo("devin-cli", "gpt-5.5-high", [
      { name: "devin-combo", models: ["dv/gpt-5.5-high"] },
    ]);
    const combo = models.find((model) => model.id === "devin-combo");

    expect(combo).toMatchObject({
      context_length: 200000,
      capabilities: { contextWindow: 200000 },
    });
  });

  it("ignores non-chat and 8k outlier seats when long-context seats exist, and aliases free-models", async () => {
    db.getProviderConnections.mockResolvedValue([]);
    db.getCombos.mockResolvedValue([
      {
        name: "gratis",
        autoSyncFree: true,
        autoSyncCategory: "free",
        models: [
          "google/gemini-2.5-flash-preview-tts",
          "opencode/mimo-v2-pro-free",
          "nvidia/deepseek-ai/deepseek-v4-flash",
        ],
      },
    ]);
    setCatalogSource({
      getModalities: () => null,
      getLimits: (_provider, model) =>
        model.includes("tts") ? { contextWindow: 8192, maxOutput: 16384 } : null,
    });
    try {
      const models = await buildModelsList(["llm"]);
      const gratis = models.find((m) => m.id === "gratis");
      const freeModels = models.find((m) => m.id === "free-models");
      expect(gratis?.context_length).toBeGreaterThanOrEqual(128000);
      expect(gratis?.capabilities?.contextWindow).toBe(gratis?.context_length);
      expect(freeModels?.context_length).toBe(gratis?.context_length);
    } finally {
      setCatalogSource(null);
    }
  });
});
