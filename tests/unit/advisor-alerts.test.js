import { describe, it, expect, beforeEach } from "vitest";
import {
  ALERT_CATEGORY,
  ALERT_SEVERITY,
  recordAlert,
  getAlerts,
  resolveAlert,
  clearAlerts,
} from "@/lib/services/alertCenter.js";
import { runModelBenchmark, getBenchmarkResults } from "@/lib/services/modelBenchmark.js";
import { generateRouterAdvisories } from "@/lib/services/routerAdvisor.js";
import { recordProviderMetric, resetProviderHealth } from "@/lib/services/providerHealthMonitor.js";

describe("Alert Center with Deduplication", () => {
  beforeEach(() => {
    clearAlerts();
  });

  it("records new alerts accurately", () => {
    const alert = recordAlert({
      category: ALERT_CATEGORY.PROVIDER_DOWN,
      severity: ALERT_SEVERITY.CRITICAL,
      target: "anthropic",
      message: "Anthropic API is unreachable",
    });

    expect(alert.id).toBeDefined();
    expect(alert.occurrenceCount).toBe(1);
    expect(alert.isResolved).toBe(false);

    const list = getAlerts();
    expect(list.length).toBe(1);
    expect(list[0].target).toBe("anthropic");
  });

  it("deduplicates identical alerts within the deduplication window", () => {
    recordAlert({
      category: ALERT_CATEGORY.RATE_LIMIT_BURST,
      target: "openai",
      message: "HTTP 429 burst detected",
    });

    // Same category and target -> should increment occurrenceCount instead of creating new alert
    recordAlert({
      category: ALERT_CATEGORY.RATE_LIMIT_BURST,
      target: "openai",
      message: "HTTP 429 burst detected again",
    });

    const list = getAlerts();
    expect(list.length).toBe(1);
    expect(list[0].occurrenceCount).toBe(2);
    expect(list[0].message).toBe("HTTP 429 burst detected again");
  });

  it("resolves alerts correctly", () => {
    const alert = recordAlert({
      category: ALERT_CATEGORY.AUTH_FAILURE,
      target: "gemini",
      message: "Invalid API key provided",
    });

    expect(resolveAlert(alert.id)).toBe(true);
    const unresolved = getAlerts({ unresolvedOnly: true });
    expect(unresolved.length).toBe(0);
  });
});

describe("Model Benchmark Engine", () => {
  it("measures TTFT, total latency, and throughput in benchmark run", async () => {
    const mockExecutor = async ({ onFirstToken }) => {
      // Simulate delay before first token
      await new Promise((r) => setTimeout(r, 50));
      if (onFirstToken) onFirstToken();
      // Simulate generation
      await new Promise((r) => setTimeout(r, 50));
      return { ok: true, content: "pong", tokensGenerated: 10 };
    };

    const res = await runModelBenchmark({
      provider: "mock_provider",
      model: "mock_model",
      executor: mockExecutor,
    });

    expect(res.success).toBe(true);
    expect(res.ttftMs).toBeGreaterThanOrEqual(40);
    expect(res.totalLatencyMs).toBeGreaterThanOrEqual(90);
    expect(res.tokensGenerated).toBe(10);
    expect(res.throughputTokensPerSec).toBeGreaterThan(0);
  });
});

describe("AI Router Advisor (Read-only)", () => {
  beforeEach(() => {
    resetProviderHealth();
    clearAlerts();
  });

  it("recommends health-based routing when a provider is UNAVAILABLE", () => {
    // 3 errors on provider
    recordProviderMetric({ provider: "failing_prov", success: false, httpStatus: 500 });
    recordProviderMetric({ provider: "failing_prov", success: false, httpStatus: 500 });
    recordProviderMetric({ provider: "failing_prov", success: false, httpStatus: 500 });

    const advisories = generateRouterAdvisories();
    expect(advisories.recommendationsCount).toBeGreaterThan(0);
    const item = advisories.recommendations.find((r) => r.category === "RESILIENCE");
    expect(item).toBeDefined();
    expect(item.affectedProvider).toBe("failing_prov");
    expect(item.recommendation).toContain("health-based");
  });

  it("suggests lowest-cost routing for combos with both free and paid seats", () => {
    const context = {
      combos: [
        {
          name: "hybrid-combo",
          strategy: "fallback",
          models: ["openrouter/google/gemini-2.0-flash-exp:free", "openai/gpt-4o"],
        },
      ],
    };

    const advisories = generateRouterAdvisories(context);
    const costAdv = advisories.recommendations.find((r) => r.category === "COST_OPTIMIZATION");
    expect(costAdv).toBeDefined();
    expect(costAdv.affectedCombo).toBe("hybrid-combo");
    expect(costAdv.recommendation).toContain("lowest-cost");
  });
});
