/**
 * AI Router Advisor for Nice Router
 * Read-only intelligent advisor that analyzes traffic patterns,
 * error rates, latency records, and token costs to produce
 * actionable routing optimization recommendations.
 */

import { getAllProvidersHealth, PROVIDER_STATUS } from "./providerHealthMonitor.js";
import { getAlerts, ALERT_SEVERITY } from "./alertCenter.js";

/**
 * Generate advisory recommendations based on current router state
 *
 * @param {object} [context]
 * @param {object[]} [context.combos] - Active user combos
 * @param {object[]} [context.recentUsage] - Recent usage statistics
 * @returns {object} { generatedAt, recommendationsCount, recommendations }
 */
export function generateRouterAdvisories(context = {}) {
  const recommendations = [];
  const healthMap = getAllProvidersHealth();
  const recentAlerts = getAlerts({ limit: 10, unresolvedOnly: true });

  // 1. Health & Resilience Advisor: Detect degraded/unavailable providers in active use
  for (const [provider, h] of Object.entries(healthMap)) {
    if (h.status === PROVIDER_STATUS.UNAVAILABLE) {
      recommendations.push({
        id: `adv-resilience-${provider}`,
        category: "RESILIENCE",
        severity: "HIGH",
        title: `Provider "${provider}" is currently UNAVAILABLE`,
        insight: `Provider has recorded ${h.consecutiveErrors} consecutive errors or authentication failures.`,
        recommendation: `Enable "health-based" routing or adjust combo order so fallback does not stall on ${provider}.`,
        affectedProvider: provider,
        estimatedImpact: "Prevents request timeouts and keeps error rate under 1%.",
      });
    } else if (h.status === PROVIDER_STATUS.DEGRADED && h.rateLimitCount > 0) {
      recommendations.push({
        id: `adv-ratelimit-${provider}`,
        category: "RATE_LIMIT",
        severity: "MEDIUM",
        title: `Frequent HTTP 429 Rate Limits on "${provider}"`,
        insight: `Provider "${provider}" has experienced ${h.rateLimitCount} rate limit events recently.`,
        recommendation: `Add a secondary backup seat or configure exponential backoff jitter on this provider.`,
        affectedProvider: provider,
        estimatedImpact: "Smooths traffic spikes and reduces client retry overhead.",
      });
    }
  }

  // 2. Cost Optimization Advisor: Recommend lowest-cost routing if costly combos detected
  const combos = context.combos || [];
  for (const combo of combos) {
    const models = combo.models || [];
    const hasFreeModel = models.some((m) => m.includes(":free") || m.includes("free"));
    const hasPaidModel = models.some((m) => m.includes("claude-opus") || m.includes("gpt-4o") || m.includes("gpt-5"));

    if (hasFreeModel && hasPaidModel && (!combo.strategy || combo.strategy === "fallback")) {
      recommendations.push({
        id: `adv-cost-${combo.name}`,
        category: "COST_OPTIMIZATION",
        severity: "MEDIUM",
        title: `Combo "${combo.name}" contains both Free and Premium seats`,
        insight: `This combo currently uses static "${combo.strategy || "fallback"}" order without cost-aware routing.`,
        recommendation: `Consider switching combo policy to "lowest-cost" to automatically prioritize free seats for routine prompts.`,
        affectedCombo: combo.name,
        estimatedImpact: "Can reduce token expenditure by 40%–80% for low-complexity turns.",
      });
    }
  }

  // 3. Latency Optimization Advisor: Flag high p95 latency
  for (const [provider, h] of Object.entries(healthMap)) {
    if (h.p95LatencyMs > 5000 && h.totalRequests >= 5) {
      recommendations.push({
        id: `adv-latency-${provider}`,
        category: "PERFORMANCE",
        severity: "LOW",
        title: `High response latency detected on "${provider}" (p95: ${h.p95LatencyMs}ms)`,
        insight: `The 95th percentile latency exceeds 5 seconds for recent queries.`,
        recommendation: `Consider pairing this model with a fast flash/mini model using "lowest-latency" policy for interactive tasks.`,
        affectedProvider: provider,
        estimatedImpact: "Improves client Time-To-First-Token (TTFT) by up to 60%.",
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    recommendationsCount: recommendations.length,
    recommendations,
  };
}
