import { describe, it, expect, beforeEach } from "vitest";
import {
  PROVIDER_STATUS,
  recordProviderMetric,
  getProviderHealth,
  getAllProvidersHealth,
  resetProviderHealth,
} from "@/lib/services/providerHealthMonitor.js";

describe("Provider Health Monitor", () => {
  beforeEach(() => {
    resetProviderHealth();
  });

  it("initializes an unprobed provider with UNKNOWN status", () => {
    const health = getProviderHealth("openai");
    expect(health.status).toBe(PROVIDER_STATUS.UNKNOWN);
    expect(health.totalRequests).toBe(0);
  });

  it("marks a provider as HEALTHY after successful requests", () => {
    recordProviderMetric({ provider: "openai", success: true, latencyMs: 250 });
    recordProviderMetric({ provider: "openai", success: true, latencyMs: 300 });

    const health = getProviderHealth("openai");
    expect(health.status).toBe(PROVIDER_STATUS.HEALTHY);
    expect(health.totalRequests).toBe(2);
    expect(health.successCount).toBe(2);
    expect(health.avgLatencyMs).toBe(275);
    expect(health.errorRate).toBe(0);
  });

  it("calculates p95 latency accurately over a series of requests", () => {
    // Inject 20 latencies: 100ms up to 2000ms
    for (let i = 1; i <= 20; i++) {
      recordProviderMetric({ provider: "anthropic", success: true, latencyMs: i * 100 });
    }

    const health = getProviderHealth("anthropic");
    // p95 of 20 items (index 19) is 1900 or 2000
    expect(health.p95LatencyMs).toBeGreaterThanOrEqual(1900);
    expect(health.avgLatencyMs).toBe(1050);
  });

  it("marks provider as DEGRADED when HTTP 429 rate limit occurs", () => {
    recordProviderMetric({ provider: "gemini", success: true, latencyMs: 200 });
    recordProviderMetric({
      provider: "gemini",
      success: false,
      latencyMs: 150,
      httpStatus: 429,
      errorMessage: "Rate limit exceeded. Please retry later.",
    });

    const health = getProviderHealth("gemini");
    expect(health.status).toBe(PROVIDER_STATUS.DEGRADED);
    expect(health.rateLimitCount).toBe(1);
  });

  it("marks provider as DEGRADED when p95 latency exceeds threshold (8000ms)", () => {
    recordProviderMetric({ provider: "slow_prov", success: true, latencyMs: 9500 });

    const health = getProviderHealth("slow_prov");
    expect(health.status).toBe(PROVIDER_STATUS.DEGRADED);
    expect(health.p95LatencyMs).toBe(9500);
  });

  it("marks provider as UNAVAILABLE on auth failure (401/403)", () => {
    recordProviderMetric({
      provider: "bad_auth_prov",
      success: false,
      latencyMs: 120,
      httpStatus: 401,
      errorMessage: "Invalid API Key",
    });

    const health = getProviderHealth("bad_auth_prov");
    expect(health.status).toBe(PROVIDER_STATUS.UNAVAILABLE);
    expect(health.authErrorCount).toBe(1);
  });

  it("marks provider as UNAVAILABLE when streak errors >= 3", () => {
    recordProviderMetric({ provider: "failing_prov", success: false, httpStatus: 500, latencyMs: 100 });
    recordProviderMetric({ provider: "failing_prov", success: false, httpStatus: 502, latencyMs: 100 });
    recordProviderMetric({ provider: "failing_prov", success: false, httpStatus: 503, latencyMs: 100 });

    const health = getProviderHealth("failing_prov");
    expect(health.status).toBe(PROVIDER_STATUS.UNAVAILABLE);
    expect(health.consecutiveErrors).toBe(3);
  });

  it("recovers to HEALTHY when subsequent requests succeed", () => {
    // 3 errors -> UNAVAILABLE
    recordProviderMetric({ provider: "recovering_prov", success: false, httpStatus: 500 });
    recordProviderMetric({ provider: "recovering_prov", success: false, httpStatus: 500 });
    recordProviderMetric({ provider: "recovering_prov", success: false, httpStatus: 500 });
    expect(getProviderHealth("recovering_prov").status).toBe(PROVIDER_STATUS.UNAVAILABLE);

    // Now succeeds
    recordProviderMetric({ provider: "recovering_prov", success: true, latencyMs: 200 });
    const health = getProviderHealth("recovering_prov");
    expect(health.consecutiveErrors).toBe(0);
    // Not consecutive unavailable anymore, still has some error rate -> DEGRADED or HEALTHY
    expect(health.status).not.toBe(PROVIDER_STATUS.UNAVAILABLE);
  });

  it("provides full metrics across all registered providers", () => {
    recordProviderMetric({ provider: "provA", success: true, latencyMs: 100 });
    recordProviderMetric({ provider: "provB", success: false, httpStatus: 500 });

    const all = getAllProvidersHealth();
    expect(all.prova).toBeDefined();
    expect(all.provb).toBeDefined();
    expect(all.prova.status).toBe(PROVIDER_STATUS.HEALTHY);
    expect(all.provb.status).toBe(PROVIDER_STATUS.DEGRADED); // 1 error out of 1 request = 100% error rate
  });
});
