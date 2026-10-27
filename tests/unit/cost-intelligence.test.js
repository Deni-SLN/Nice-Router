import { describe, it, expect } from "vitest";
import {
  PRICING_STATUS,
  resolveModelPricingStatus,
  calculateCostWithStatus,
  formatCostFormatted,
  DEFAULT_USD_IDR_RATE,
} from "@/lib/services/costIntelligence.js";

describe("Cost Intelligence Engine", () => {
  describe("resolveModelPricingStatus", () => {
    it("identifies upstream free namespaces as FREE", () => {
      const res = resolveModelPricingStatus("cline", "cline-free/deepseek-v4.1-flash");
      expect(res.status).toBe(PRICING_STATUS.FREE);
      expect(res.pricing.input).toBe(0);
      expect(res.pricing.output).toBe(0);
    });

    it("identifies OpenRouter :free suffix models as FREE", () => {
      const res = resolveModelPricingStatus("openrouter", "google/gemini-2.0-flash-exp:free");
      expect(res.status).toBe(PRICING_STATUS.FREE);
    });

    it("identifies known priced models correctly as PRICED", () => {
      const res = resolveModelPricingStatus("anthropic", "claude-3-5-sonnet-20241022");
      expect(res.status).toBe(PRICING_STATUS.PRICED);
      expect(res.pricing.input).toBe(3.00);
      expect(res.pricing.output).toBe(15.00);
    });

    it("identifies unknown models with vendor prefix as UNKNOWN_PRICE", () => {
      const res = resolveModelPricingStatus("custom_prov", "custom_prov/unknown-model-xyz");
      expect(res.status).toBe(PRICING_STATUS.UNKNOWN_PRICE);
      expect(res.pricing).toBeNull();
    });

    it("identifies completely bare unknown models without provider as UNMAPPED_MODEL", () => {
      const res = resolveModelPricingStatus("", "completely-unmapped-custom-name");
      expect(res.status).toBe(PRICING_STATUS.UNMAPPED_MODEL);
    });

    it("respects user pricing override", () => {
      const override = { input: 1.5, output: 4.5, cached: 0.2 };
      const res = resolveModelPricingStatus("openai", "gpt-4o", override);
      expect(res.status).toBe(PRICING_STATUS.PRICED);
      expect(res.pricing.input).toBe(1.5);
      expect(res.source).toBe("user_override");
    });
  });

  describe("calculateCostWithStatus — Accuracy & Safeguards", () => {
    it("computes standard input and output costs correctly", () => {
      const tokens = {
        prompt_tokens: 1000000,
        completion_tokens: 1000000,
      };
      // claude-3-5-sonnet-20241022: input $3.00/M, output $15.00/M
      const res = calculateCostWithStatus({
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        tokens,
        customExchangeRate: 16000,
      });

      expect(res.status).toBe(PRICING_STATUS.PRICED);
      expect(res.costUSD).toBe(18.00);
      expect(res.costIDR).toBe(288000); // 18 * 16000
      expect(res.breakdown.inputCostUSD).toBe(3.00);
      expect(res.breakdown.outputCostUSD).toBe(15.00);
    });

    it("prevents double counting on cached input tokens", () => {
      // In canonicalizeUsage: prompt_tokens = total input INCLUDING cached.
      // prompt_tokens = 1,000,000; cached_tokens = 800,000.
      // Non-cached = 200,000.
      // Rates: input = $3.00/M, cached = $1.50/M.
      // Cost non-cached = 0.2 * 3 = $0.60.
      // Cost cached = 0.8 * 1.5 = $1.20.
      // Total input cost = $1.80 (NOT 1.0 * 3 + 0.8 * 1.5 = $4.20!).
      const tokens = {
        prompt_tokens: 1000000,
        completion_tokens: 0,
        cached_tokens: 800000,
      };
      const res = calculateCostWithStatus({
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        tokens,
      });

      expect(res.status).toBe(PRICING_STATUS.PRICED);
      expect(res.breakdown.inputCostUSD).toBe(0.60);
      expect(res.breakdown.cachedCostUSD).toBe(1.20);
      expect(res.costUSD).toBe(1.80);
    });

    it("prevents reasoning token double counting when completion_tokens includes reasoning", () => {
      // If output rate = reasoning rate ($15.00/M), completion_tokens already includes reasoning.
      // Total output cost should be exactly 100,000 * $15/M = $1.50, NOT $1.50 + $0.30!
      const tokens = {
        prompt_tokens: 0,
        completion_tokens: 100000,
        reasoning_tokens: 20000,
      };
      const res = calculateCostWithStatus({
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        tokens,
      });

      expect(res.status).toBe(PRICING_STATUS.PRICED);
      expect(res.breakdown.outputCostUSD).toBe(1.50);
      expect(res.breakdown.reasoningCostUSD).toBe(0);
      expect(res.costUSD).toBe(1.50);
    });

    it("marks UNKNOWN_PRICE and does NOT return $0.00 for unpriced models", () => {
      const tokens = { prompt_tokens: 5000, completion_tokens: 1000 };
      const res = calculateCostWithStatus({
        provider: "some_unregistered_provider",
        model: "novel-super-ai:v99",
        tokens,
      });

      expect(res.status).toBe(PRICING_STATUS.UNKNOWN_PRICE);
      expect(res.costUSD).toBeNull();
      expect(res.costIDR).toBeNull();
    });

    it("marks UNMETERED when token counts are missing on a priced model", () => {
      const res = calculateCostWithStatus({
        provider: "openai",
        model: "gpt-4o",
        tokens: null,
      });

      expect(res.status).toBe(PRICING_STATUS.UNMETERED);
      expect(res.costUSD).toBeNull();
      expect(res.isMetered).toBe(false);
    });

    it("returns zero cost with FREE status for confirmed free models", () => {
      const tokens = { prompt_tokens: 10000, completion_tokens: 5000 };
      const res = calculateCostWithStatus({
        provider: "openrouter",
        model: "google/gemini-2.0-flash-exp:free",
        tokens,
      });

      expect(res.status).toBe(PRICING_STATUS.FREE);
      expect(res.costUSD).toBe(0);
      expect(res.costIDR).toBe(0);
      expect(res.isMetered).toBe(true);
    });
  });

  describe("formatCostFormatted — Currency Formatting", () => {
    it("formats USD with appropriate decimals", () => {
      expect(formatCostFormatted(15.5)).toBe("$15.50");
      expect(formatCostFormatted(0.0042)).toBe("$0.0042");
      expect(formatCostFormatted(0)).toBe("$0.00");
      expect(formatCostFormatted(null)).toBe("-");
    });

    it("formats IDR correctly with thousand separators", () => {
      expect(formatCostFormatted(1.0, "IDR", 16300)).toBe("Rp 16.300");
      expect(formatCostFormatted(0, "IDR", 16300)).toBe("Rp 0");
      expect(formatCostFormatted(null, "IDR", 16300)).toBe("-");
    });
  });
});
