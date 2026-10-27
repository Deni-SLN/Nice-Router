import { describe, it, expect, beforeEach } from "vitest";
import {
  CIRCUIT_STATE,
  getCircuitState,
  shouldAllowRequest,
  resetCircuits,
  calculateBackoffDelay,
  canSafelyFallback,
} from "@/lib/services/fallbackEngine.js";
import {
  BUDGET_ACTION,
  setBudgetConfig,
  getBudgetConfig,
  evaluateBudgetGuard,
} from "@/lib/services/budgetGuard.js";
import { recordProviderMetric, resetProviderHealth } from "@/lib/services/providerHealthMonitor.js";
import { PRICING_STATUS } from "@/lib/services/costIntelligence.js";

describe("Fallback & Retry Engine", () => {
  beforeEach(() => {
    resetCircuits();
    resetProviderHealth();
  });

  describe("Circuit Breaker", () => {
    it("starts in CLOSED state for healthy or unprobed provider", () => {
      const state = getCircuitState("openai");
      expect(state.state).toBe(CIRCUIT_STATE.CLOSED);
      const allow = shouldAllowRequest("openai");
      expect(allow.allowed).toBe(true);
    });

    it("trips to OPEN state when provider is marked UNAVAILABLE", () => {
      // 3 consecutive errors -> health becomes UNAVAILABLE
      recordProviderMetric({ provider: "anthropic", success: false, httpStatus: 500 });
      recordProviderMetric({ provider: "anthropic", success: false, httpStatus: 500 });
      recordProviderMetric({ provider: "anthropic", success: false, httpStatus: 500 });

      const state = getCircuitState("anthropic");
      expect(state.state).toBe(CIRCUIT_STATE.OPEN);

      const allow = shouldAllowRequest("anthropic");
      expect(allow.allowed).toBe(false);
      expect(allow.state).toBe(CIRCUIT_STATE.OPEN);
      expect(allow.reason).toContain("cooldown period");
    });
  });

  describe("Backoff & Jitter", () => {
    it("respects Retry-After header if provided in seconds", () => {
      const delay = calculateBackoffDelay({
        attempt: 1,
        retryAfterHeader: "3", // 3 seconds
      });
      expect(delay).toBe(3000);
    });

    it("calculates exponential backoff within bounds and with jitter", () => {
      const delay1 = calculateBackoffDelay({ attempt: 1, baseMs: 500, maxMs: 5000, jitterRatio: 0.1 });
      // 500 * (1 +/- 0.1) -> between 450 and 550
      expect(delay1).toBeGreaterThanOrEqual(450);
      expect(delay1).toBeLessThanOrEqual(550);

      const delay3 = calculateBackoffDelay({ attempt: 3, baseMs: 500, maxMs: 5000, jitterRatio: 0.1 });
      // 500 * 4 = 2000 -> between 1800 and 2200
      expect(delay3).toBeGreaterThanOrEqual(1800);
      expect(delay3).toBeLessThanOrEqual(2200);
    });
  });

  describe("Streaming Safeguard", () => {
    it("allows fallback on non-streaming requests unconditionally", () => {
      const check = canSafelyFallback({ isStreaming: false, hasStreamStarted: false, chunksEmittedCount: 0 });
      expect(check.canFallback).toBe(true);
    });

    it("allows fallback if streaming failed before emitting first chunk", () => {
      const check = canSafelyFallback({ isStreaming: true, hasStreamStarted: false, chunksEmittedCount: 0 });
      expect(check.canFallback).toBe(true);
    });

    it("PREVENTS fallback if streaming already emitted chunks to avoid broken client framing", () => {
      const check = canSafelyFallback({ isStreaming: true, hasStreamStarted: true, chunksEmittedCount: 3 });
      expect(check.canFallback).toBe(false);
      expect(check.reason).toContain("aborted to prevent broken/duplicate output");
    });
  });
});

describe("Budget Guard Engine", () => {
  beforeEach(() => {
    setBudgetConfig({
      dailyLimitUSD: 10.0,
      monthlyLimitUSD: 100.0,
      warningThresholdRatio: 0.8,
      defaultAction: BUDGET_ACTION.BLOCK,
      approvedFreeModel: "openrouter/google/gemini-2.0-flash-exp:free",
      conservativeCostForUnknownUSD: 0.05,
      keyLimitsUSD: {},
    });
  });

  it("exempts confirmed FREE models from budget limits", () => {
    const res = evaluateBudgetGuard({
      requestedModel: "gemini-free",
      pricingStatus: PRICING_STATUS.FREE,
      estimatedCostUSD: 0,
      currentDaySpendUSD: 15.0, // Over daily limit!
    });

    expect(res.allowed).toBe(true);
    expect(res.reason).toContain("Confirmed FREE model");
  });

  it("blocks requests when daily limit is exceeded under BLOCK action", () => {
    const res = evaluateBudgetGuard({
      requestedModel: "claude-3-5-sonnet",
      pricingStatus: PRICING_STATUS.PRICED,
      estimatedCostUSD: 0.50,
      currentDaySpendUSD: 9.80, // 9.80 + 0.50 = 10.30 > 10.0
    });

    expect(res.allowed).toBe(false);
    expect(res.action).toBe(BUDGET_ACTION.BLOCK);
    expect(res.reason).toContain("Global daily budget limit ($10) exceeded");
  });

  it("downgrades to approved free model when action is DOWNGRADE", () => {
    setBudgetConfig({ defaultAction: BUDGET_ACTION.DOWNGRADE });

    const res = evaluateBudgetGuard({
      requestedModel: "gpt-4o",
      pricingStatus: PRICING_STATUS.PRICED,
      estimatedCostUSD: 1.0,
      currentDaySpendUSD: 9.50, // 9.50 + 1.0 = 10.50 > 10.0
    });

    expect(res.allowed).toBe(true);
    expect(res.action).toBe(BUDGET_ACTION.DOWNGRADE);
    expect(res.targetModel).toBe("openrouter/google/gemini-2.0-flash-exp:free");
    expect(res.reason).toContain("automatically downgraded");
  });

  it("triggers warning when threshold ratio (80%) is crossed under WARNING action", () => {
    setBudgetConfig({ defaultAction: BUDGET_ACTION.WARNING });

    const res = evaluateBudgetGuard({
      requestedModel: "claude-3-5-sonnet",
      pricingStatus: PRICING_STATUS.PRICED,
      estimatedCostUSD: 0.50,
      currentDaySpendUSD: 8.0, // 8.0 + 0.5 = 8.5 (85% of 10)
    });

    expect(res.allowed).toBe(true);
    expect(res.warningTriggered).toBe(true);
    expect(res.action).toBe(BUDGET_ACTION.WARNING);
    expect(res.reason).toContain("85.0%");
  });

  it("enforces per-API-key budget limits", () => {
    setBudgetConfig({
      keyLimitsUSD: {
        "key_client_abc": { dailyLimitUSD: 2.0, action: BUDGET_ACTION.BLOCK },
      },
    });

    const res = evaluateBudgetGuard({
      apiKey: "key_client_abc",
      requestedModel: "gpt-4o",
      pricingStatus: PRICING_STATUS.PRICED,
      estimatedCostUSD: 0.50,
      currentKeyDaySpendUSD: 1.80, // 1.80 + 0.50 = 2.30 > 2.0
    });

    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Daily limit of $2 exceeded for this API key");
  });
});
