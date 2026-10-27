import { describe, it, expect, beforeEach } from "vitest";
import {
  ROUTING_POLICY,
  TASK_TYPES,
  resolveSmartRoute,
  simulateSmartRoute,
} from "@/lib/services/smartRouting.js";
import { recordProviderMetric, resetProviderHealth } from "@/lib/services/providerHealthMonitor.js";

describe("Smart Routing Engine", () => {
  beforeEach(() => {
    resetProviderHealth();
  });

  const sampleCombo = [
    "anthropic/claude-3-5-sonnet-20241022",
    "openai/gpt-4o",
    "openrouter/google/gemini-2.0-flash-exp:free",
  ];

  it("selects lowest-cost model (preferring confirmed FREE model)", () => {
    const route = resolveSmartRoute({
      requestedModel: "my-smart-combo",
      candidateModels: sampleCombo,
      policy: ROUTING_POLICY.LOWEST_COST,
    });

    // gemini free is $0, so it should be ranked first
    expect(route.selectedModel).toBe("openrouter/google/gemini-2.0-flash-exp:free");
    expect(route.policyUsed).toBe(ROUTING_POLICY.LOWEST_COST);
    expect(route.selectionReason).toContain("Lowest cost");
  });

  it("selects lowest-latency model based on recorded health latency", () => {
    // anthropic: 1200ms
    recordProviderMetric({ provider: "anthropic", success: true, latencyMs: 1200 });
    // openai: 250ms
    recordProviderMetric({ provider: "openai", success: true, latencyMs: 250 });
    // openrouter: 800ms
    recordProviderMetric({ provider: "openrouter", success: true, latencyMs: 800 });

    const route = resolveSmartRoute({
      requestedModel: "fast-combo",
      candidateModels: sampleCombo,
      policy: ROUTING_POLICY.LOWEST_LATENCY,
    });

    expect(route.selectedModel).toBe("openai/gpt-4o");
    expect(route.decisionMetadata.selectedProvider).toBe("openai");
  });

  it("deprioritizes UNAVAILABLE providers in health-based policy", () => {
    // 3 errors on anthropic -> UNAVAILABLE
    recordProviderMetric({ provider: "anthropic", success: false, httpStatus: 500 });
    recordProviderMetric({ provider: "anthropic", success: false, httpStatus: 500 });
    recordProviderMetric({ provider: "anthropic", success: false, httpStatus: 500 });

    // openai healthy
    recordProviderMetric({ provider: "openai", success: true, latencyMs: 300 });

    const route = resolveSmartRoute({
      requestedModel: "resilient-combo",
      candidateModels: sampleCombo,
      policy: ROUTING_POLICY.HEALTH_BASED,
    });

    expect(route.selectedModel).toBe("openai/gpt-4o");
    // anthropic should be moved to the end of rankedModels
    expect(route.rankedModels[route.rankedModels.length - 1]).toBe("anthropic/claude-3-5-sonnet-20241022");
  });

  it("selects task-optimized model for coding", () => {
    const candidates = [
      "openai/gpt-4o-mini",
      "anthropic/claude-3-7-sonnet",
      "google/gemini-flash",
    ];

    const route = resolveSmartRoute({
      requestedModel: "coding-combo",
      candidateModels: candidates,
      policy: ROUTING_POLICY.TASK_BASED,
      taskType: TASK_TYPES.CODING,
    });

    expect(route.selectedModel).toBe("anthropic/claude-3-7-sonnet");
  });

  it("simulates smart route with transparency metadata in dry-run mode", () => {
    const dryRun = simulateSmartRoute({
      requestedModel: "test-dryrun",
      candidateModels: sampleCombo,
      policy: ROUTING_POLICY.LOWEST_COST,
    });

    expect(dryRun.selectedModel).toBeDefined();
    expect(dryRun.rankedModels.length).toBe(3);
    expect(dryRun.decisionMetadata.candidatesEvaluated).toBe(3);
    expect(dryRun.decisionMetadata.policy).toBe(ROUTING_POLICY.LOWEST_COST);
  });
});
