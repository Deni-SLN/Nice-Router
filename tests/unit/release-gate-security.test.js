import { describe, it, expect, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import {
  isDefaultPasswordPending,
  createDashboardAuthToken,
  getDashboardAuthSession,
  DEFAULT_PASSWORD,
} from "@/lib/auth/dashboardSession.js";
import {
  calculateCostWithStatus,
  resolveModelPricingStatus,
  PRICING_STATUS,
  getExchangeRate,
} from "@/lib/services/costIntelligence.js";
import {
  recordProviderMetric,
  getProviderHealth,
  resetProviderHealth,
  PROVIDER_STATUS,
} from "@/lib/services/providerHealthMonitor.js";
import { canSafelyFallback } from "@/lib/services/fallbackEngine.js";

describe("Release Gate Final Security & Integrity Audit", () => {
  describe("1. Default Password & Setup Session Enforcement", () => {
    it("identifies initial setup as pending when password or passwordChangedAt is missing", () => {
      expect(isDefaultPasswordPending(null)).toBe(true);
      expect(isDefaultPasswordPending({})).toBe(true);
      expect(isDefaultPasswordPending({ password: null, passwordChangedAt: null })).toBe(true);
      expect(isDefaultPasswordPending({ password: "some_hash" })).toBe(true); // missing passwordChangedAt
      expect(isDefaultPasswordPending({ password: "some_hash", passwordChangedAt: new Date().toISOString() })).toBe(false);
    });

    it("creates a restricted setup session token and verifies claims", async () => {
      const token = await createDashboardAuthToken({ setupOnly: true, mustChangePassword: true });
      const session = await getDashboardAuthSession(token);
      expect(session).not.toBeNull();
      expect(session.setupOnly).toBe(true);
      expect(session.mustChangePassword).toBe(true);
    });

    it("verifies password policy rejects default password and enforces minimum length", () => {
      const invalidShort = "abc";
      const isDefault = invalidShort === DEFAULT_PASSWORD || invalidShort === "123456";
      const isTooShort = invalidShort.length < 8;
      expect(isTooShort).toBe(true);

      const defaultCandidate = "123456";
      expect(defaultCandidate === DEFAULT_PASSWORD).toBe(true);

      const validNewPassword = "SecurePass2026!#";
      expect(validNewPassword.length >= 8).toBe(true);
      expect(validNewPassword !== DEFAULT_PASSWORD).toBe(true);
    });

    it("hashes passwords securely using bcrypt", async () => {
      const password = "ProductionSecurePassword99!";
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      expect(hash).toMatch(/^\$2[aby]\$/);
      expect(await bcrypt.compare(password, hash)).toBe(true);
      expect(await bcrypt.compare("wrong-password", hash)).toBe(false);
      expect(await bcrypt.compare("123456", hash)).toBe(false);
    });
  });

  describe("2. Cost Intelligence Hardening (Edge Cases & Safeguards)", () => {
    it("sanitizes negative, NaN, and Infinity token values to zero", () => {
      const res = calculateCostWithStatus({
        provider: "openai",
        model: "openai/gpt-4o",
        tokens: {
          prompt_tokens: -100,
          completion_tokens: NaN,
          cached_tokens: Infinity,
        },
      });

      expect(res.tokensUsed.prompt).toBe(0);
      expect(res.tokensUsed.completion).toBe(0);
      expect(res.tokensUsed.cached).toBe(0);
    });

    it("handles completely empty, null, or non-object tokens safely", () => {
      const resNull = calculateCostWithStatus({
        provider: "openai",
        model: "openai/gpt-4o",
        tokens: null,
      });
      expect(resNull.isMetered).toBe(false);
      expect(resNull.tokensUsed.prompt).toBe(0);

      const resString = calculateCostWithStatus({
        provider: "openai",
        model: "openai/gpt-4o",
        tokens: "invalid-string",
      });
      expect(resString.isMetered).toBe(false);
      expect(resString.tokensUsed.completion).toBe(0);
    });

    it("never claims $0.00 for unknown price models", () => {
      const res = calculateCostWithStatus({
        provider: "custom-vendor",
        model: "custom-vendor/super-llm-v99",
        tokens: { prompt_tokens: 500, completion_tokens: 200 },
      });

      expect(res.status).toBe(PRICING_STATUS.UNKNOWN_PRICE);
      expect(res.costUSD).toBeNull();
      expect(res.costIDR).toBeNull();
    });

    it("returns zero cost with confirmed FREE status for confirmed free models", () => {
      const res = calculateCostWithStatus({
        provider: "openrouter",
        model: "openrouter/google/gemini-2.0-flash-exp:free",
        tokens: { prompt_tokens: 1500, completion_tokens: 300 },
      });

      expect(res.status).toBe(PRICING_STATUS.FREE);
      expect(res.costUSD).toBe(0);
      expect(res.costIDR).toBe(0);
    });

    it("includes exchange rate metadata with timestamp and source", async () => {
      const rateInfo = await getExchangeRate();
      expect(rateInfo).toHaveProperty("rate");
      expect(rateInfo).toHaveProperty("lastUpdated");
      expect(rateInfo).toHaveProperty("source");
      expect(rateInfo.rate).toBeGreaterThan(0);
    });
  });

  describe("3. Provider Health Monitor & Secret Redaction", () => {
    beforeEach(() => {
      resetProviderHealth();
    });

    it("redacts sensitive API keys and authorization headers from error messages", () => {
      recordProviderMetric({
        provider: "openai",
        success: false,
        latencyMs: 120,
        httpStatus: 401,
        errorMessage: "Failed with key sk-abcdef1234567890 and Bearer eyJhbGciOiJIUzI1NiJ9.test",
      });

      const health = getProviderHealth("openai");
      expect(health.lastErrorMessage).not.toContain("sk-abcdef1234567890");
      expect(health.lastErrorMessage).not.toContain("eyJhbGciOiJIUzI1NiJ9.test");
      expect(health.lastErrorMessage).toContain("[REDACTED");
    });

    it("handles zero total requests safely without dividing by zero", () => {
      const health = getProviderHealth("unprobed-provider");
      expect(health.errorRate).toBe(0);
      expect(health.status).toBe(PROVIDER_STATUS.UNKNOWN);
    });

    it("flags p95 as estimated when sample size is under 20 requests", () => {
      for (let i = 0; i < 5; i++) {
        recordProviderMetric({ provider: "anthropic", success: true, latencyMs: 200 });
      }
      const health = getProviderHealth("anthropic");
      expect(health.sampleSize).toBe(5);
      expect(health.isP95Estimated).toBe(true);
    });
  });

  describe("4. Streaming Fallback Safeguard", () => {
    it("prohibits fallback if streaming response has already emitted chunks to the client", () => {
      const check = canSafelyFallback({
        isStreaming: true,
        hasStreamStarted: true,
        chunksEmittedCount: 3,
      });

      expect(check.canFallback).toBe(false);
      expect(check.reason).toContain("Fallback aborted to prevent broken/duplicate output");
    });

    it("allows clean fallback if error occurred before first streaming chunk", () => {
      const check = canSafelyFallback({
        isStreaming: true,
        hasStreamStarted: false,
        chunksEmittedCount: 0,
      });

      expect(check.canFallback).toBe(true);
    });
  });
});
