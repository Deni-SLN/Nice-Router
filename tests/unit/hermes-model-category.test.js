import { describe, it, expect } from "vitest";
import { MODEL_CATEGORIES, matchesModelCategory } from "../../src/shared/constants/modelCategories.js";

describe("Hermes Agent category and model matching", () => {
  it("defines hermes category in MODEL_CATEGORIES", () => {
    const hermesCat = MODEL_CATEGORIES.find((c) => c.id === "hermes");
    expect(hermesCat).toBeDefined();
    expect(hermesCat.label).toBe("Hermes Agent");
    expect(hermesCat.emoji).toBe("⚡");
  });

  it("matches explicit Hermes and Nous models", () => {
    expect(matchesModelCategory({ id: "nous-hermes-3-llama-3.1-8b", name: "Hermes 3" }, "hermes")).toBe(true);
    expect(matchesModelCategory("openrouter/nousresearch/hermes-3-llama-3.1-405b", "hermes")).toBe(true);
    expect(matchesModelCategory({ id: "agent-compatible-v1", name: "Custom Agent" }, "hermes")).toBe(true);
  });

  it("matches models with tools capability and sufficient context window (>= 16k)", () => {
    const modelWithToolsAndContext = {
      id: "my-custom-model",
      name: "Custom LLM",
      caps: { tools: true, contextWindow: 32000 },
    };
    expect(matchesModelCategory(modelWithToolsAndContext, "hermes")).toBe(true);

    const modelWithToolsDefaultContext = {
      id: "unspecified-context-model",
      caps: { tools: true },
    };
    expect(matchesModelCategory(modelWithToolsDefaultContext, "hermes")).toBe(true);
  });

  it("rejects models with tools but tiny context (< 16k)", () => {
    const tinyModel = {
      id: "tiny-tool-model",
      name: "Tiny Tool Model",
      caps: { tools: true, contextWindow: 8000 },
    };
    expect(matchesModelCategory(tinyModel, "hermes")).toBe(false);
  });

  it("matches well-known tool-capable agent models by name fallback", () => {
    expect(matchesModelCategory("anthropic/claude-3-5-sonnet", "hermes")).toBe(true);
    expect(matchesModelCategory("openai/gpt-4o", "hermes")).toBe(true);
    expect(matchesModelCategory("deepseek/deepseek-chat", "hermes")).toBe(true);
    expect(matchesModelCategory("google/gemini-2.0-flash", "hermes")).toBe(true);
  });

  it("rejects non-tool models or pure image/voice models", () => {
    const pureImageModel = {
      id: "black-forest-labs/flux-1-schnell",
      name: "FLUX 1 Schnell",
      kind: "image",
      caps: { tools: false },
    };
    expect(matchesModelCategory(pureImageModel, "hermes")).toBe(false);

    const simpleModel = {
      id: "dummy-raw-text",
      name: "Simple Text",
      caps: { tools: false, contextWindow: 4000 },
    };
    expect(matchesModelCategory(simpleModel, "hermes")).toBe(false);
  });
});
