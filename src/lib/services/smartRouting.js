/**
 * Smart Routing Engine for Nice Router
 * Provides backend routing policies:
 * - manual / priority
 * - lowest-cost
 * - lowest-latency
 * - capability-based
 * - health-based
 * - task-based
 *
 * Includes routing transparency metadata and dry-run simulation.
 */

import { getCapabilitiesForModel } from "open-sse/providers/capabilities.js";
import { resolveModelPricingStatus, calculateCostWithStatus, PRICING_STATUS } from "./costIntelligence.js";
import { getProviderHealth, PROVIDER_STATUS } from "./providerHealthMonitor.js";
import { detectRequiredCapabilities } from "open-sse/services/combo.js";

export const ROUTING_POLICY = {
  MANUAL: "manual",
  PRIORITY: "priority",
  LOWEST_COST: "lowest-cost",
  LOWEST_LATENCY: "lowest-latency",
  CAPABILITY: "capability",
  HEALTH_BASED: "health-based",
  TASK_BASED: "task-based",
};

export const TASK_TYPES = {
  CODING: "coding",
  REASONING: "reasoning",
  GENERAL_CHAT: "general_chat",
  RESEARCH: "research",
  VISION: "vision",
  AUDIO: "audio",
  AGENT: "agent",
};

/**
 * Task-specific model affinity keywords and priority hints
 */
const TASK_KEYWORD_AFFINITIES = {
  [TASK_TYPES.CODING]: ["codex", "coder", "code", "sonnet", "deepseek-coder", "qwen-coder", "claude-3-7-sonnet"],
  [TASK_TYPES.REASONING]: ["r1", "o1", "o3", "reasoning", "thinking", "gemini-2.5-pro", "opus"],
  [TASK_TYPES.GENERAL_CHAT]: ["flash", "mini", "haiku", "gpt-4o", "chat"],
  [TASK_TYPES.RESEARCH]: ["pro", "opus", "deepseek", "gemini-1.5-pro", "sonar"],
  [TASK_TYPES.VISION]: ["vision", "vl", "omni", "gpt-4o", "flash"],
  [TASK_TYPES.AUDIO]: ["audio", "voice", "whisper", "speech"],
  [TASK_TYPES.AGENT]: ["tool", "function", "claude-3-5", "claude-3-7", "gpt-4o", "sonnet"],
};

/**
 * Split "provider/model" into components
 */
function parseModelIdentifier(str) {
  if (!str || typeof str !== "string") return { provider: "", model: "" };
  const slash = str.indexOf("/");
  if (slash > 0) {
    return { provider: str.slice(0, slash), model: str.slice(slash + 1) };
  }
  return { provider: "", model: str };
}

/**
 * Score a candidate model's suitability for a task
 */
function getTaskAffinityScore(modelStr, taskType) {
  if (!taskType || !TASK_KEYWORD_AFFINITIES[taskType]) return 0;
  const lower = modelStr.toLowerCase();
  const keywords = TASK_KEYWORD_AFFINITIES[taskType];
  let score = 0;
  for (let i = 0; i < keywords.length; i++) {
    if (lower.includes(keywords[i])) {
      // Earlier keywords in list have higher priority
      score += (keywords.length - i) * 10;
    }
  }
  return score;
}

/**
 * Resolve candidate models through Smart Routing policies
 *
 * @param {object} params
 * @param {string} params.requestedModel - Model requested by client
 * @param {string[]} params.candidateModels - Candidate models in combo or pool
 * @param {string} [params.policy] - Routing policy enum
 * @param {string} [params.taskType] - Optional task categorization
 * @param {object} [params.body] - Request body (for token and modality estimation)
 * @param {object} [params.userPreferences] - Optional cost/latency weightings
 * @returns {object} Decision object { selectedModel, rankedModels, policyUsed, selectionReason, decisionMetadata }
 */
export function resolveSmartRoute({
  requestedModel,
  candidateModels = [],
  policy = ROUTING_POLICY.PRIORITY,
  taskType = null,
  body = null,
  userPreferences = {},
}) {
  if (!Array.isArray(candidateModels) || candidateModels.length === 0) {
    const single = requestedModel || "unknown";
    return {
      selectedModel: single,
      rankedModels: [single],
      policyUsed: policy,
      selectionReason: "Single model requested (no combo candidates)",
      decisionMetadata: { candidatesCount: 1, policy },
    };
  }

  if (candidateModels.length === 1) {
    return {
      selectedModel: candidateModels[0],
      rankedModels: candidateModels,
      policyUsed: policy,
      selectionReason: "Single candidate available",
      decisionMetadata: { candidatesCount: 1, policy },
    };
  }

  // Detect modalities/capabilities required by the request body
  const requiredCaps = body ? detectRequiredCapabilities(body) : new Set();
  const estimatedInputTokens = (() => {
    if (!body || typeof body !== "object") return 0;
    const raw = JSON.stringify(body.messages || body.input || body.contents || body.prompt || "");
    return Math.ceil(raw.length / 3.5);
  })();
  const requiredContextWindow = Math.max(Number(userPreferences?.minContextWindow) || 0, Number(body?.min_context_length) || 0, estimatedInputTokens);

  // Annotate each candidate with pricing, health, latency, and capability fit
  const candidateScores = candidateModels.map((item, originalIndex) => {
    const { provider, model } = parseModelIdentifier(item);
    const health = getProviderHealth(provider);
    const pricingStatus = resolveModelPricingStatus(provider, model);
    const caps = getCapabilitiesForModel(provider, model) || {};

    // Capability check: does candidate support all hard required capabilities?
    const missingCaps = [];
    for (const c of requiredCaps) {
      if (caps[c] !== true) {
        missingCaps.push(c);
      }
    }
    const modelContextWindow = caps.contextWindow || 200000;
    if (requiredContextWindow > 0 && modelContextWindow < requiredContextWindow) {
      missingCaps.push(`contextWindow(${modelContextWindow}<${requiredContextWindow})`);
    }
    const satisfiesCapabilities = missingCaps.length === 0;

    // Cost estimation (simulate for a 1K in / 500 out sample turn)
    const sampleCost = calculateCostWithStatus({
      provider,
      model,
      tokens: { prompt_tokens: 1000, completion_tokens: 500 },
    });
    const estimatedCostUSD = sampleCost.costUSD !== null ? sampleCost.costUSD : 999.0;
    const isFree = sampleCost.status === PRICING_STATUS.FREE;

    // Latency
    const avgLatency = health.avgLatencyMs || 500;
    const p95Latency = health.p95LatencyMs || avgLatency;

    // Health penalty
    let healthPenalty = 0;
    if (health.status === PROVIDER_STATUS.UNAVAILABLE) {
      healthPenalty = 10000;
    } else if (health.status === PROVIDER_STATUS.DEGRADED) {
      healthPenalty = 1000;
    }

    // Task score
    const taskScore = taskType ? getTaskAffinityScore(item, taskType) : 0;

    return {
      modelIdentifier: item,
      provider,
      model,
      originalIndex,
      healthStatus: health.status,
      errorRate: health.errorRate || 0,
      avgLatency,
      p95Latency,
      pricingStatus: pricingStatus.status,
      isFree,
      estimatedCostUSD,
      satisfiesCapabilities,
      missingCaps,
      taskScore,
      healthPenalty,
    };
  });

  let ranked = [...candidateScores];
  let selectionReason = "";

  // 1. Mandatory capability filtering: float capable models first
  ranked.sort((a, b) => {
    if (a.satisfiesCapabilities !== b.satisfiesCapabilities) {
      return a.satisfiesCapabilities ? -1 : 1;
    }
    return 0;
  });

  // Apply policy-specific sorting
  switch (policy) {
    case ROUTING_POLICY.LOWEST_COST: {
      ranked.sort((a, b) => {
        // Disqualify unavailable providers
        if (a.healthStatus === PROVIDER_STATUS.UNAVAILABLE && b.healthStatus !== PROVIDER_STATUS.UNAVAILABLE) return 1;
        if (b.healthStatus === PROVIDER_STATUS.UNAVAILABLE && a.healthStatus !== PROVIDER_STATUS.UNAVAILABLE) return -1;

        // Capability fit first
        if (a.satisfiesCapabilities !== b.satisfiesCapabilities) return a.satisfiesCapabilities ? -1 : 1;

        // FREE models first
        if (a.isFree && !b.isFree) return -1;
        if (!a.isFree && b.isFree) return 1;

        // Compare estimated cost
        if (a.estimatedCostUSD !== b.estimatedCostUSD) {
          return a.estimatedCostUSD - b.estimatedCostUSD;
        }

        // Tie-breaker: lower latency
        return a.avgLatency - b.avgLatency;
      });
      const top = ranked[0];
      selectionReason = `Lowest cost model chosen (${top.isFree ? "FREE" : `$${top.estimatedCostUSD.toFixed(4)}/req`}, status: ${top.healthStatus})`;
      break;
    }

    case ROUTING_POLICY.LOWEST_LATENCY: {
      ranked.sort((a, b) => {
        // Capability fit first
        if (a.satisfiesCapabilities !== b.satisfiesCapabilities) return a.satisfiesCapabilities ? -1 : 1;

        // Avoid completely unavailable models
        if (a.healthStatus === PROVIDER_STATUS.UNAVAILABLE && b.healthStatus !== PROVIDER_STATUS.UNAVAILABLE) return 1;
        if (b.healthStatus === PROVIDER_STATUS.UNAVAILABLE && a.healthStatus !== PROVIDER_STATUS.UNAVAILABLE) return -1;

        // Compare p95 + avg latency + health penalty
        const costA = a.p95Latency + a.healthPenalty;
        const costB = b.p95Latency + b.healthPenalty;
        return costA - costB;
      });
      const top = ranked[0];
      selectionReason = `Lowest latency model chosen (p95: ${top.p95Latency}ms, avg: ${top.avgLatency}ms, health: ${top.healthStatus})`;
      break;
    }

    case ROUTING_POLICY.HEALTH_BASED: {
      ranked.sort((a, b) => {
        // Capability fit first
        if (a.satisfiesCapabilities !== b.satisfiesCapabilities) return a.satisfiesCapabilities ? -1 : 1;

        // Health rank: HEALTHY (0) > UNKNOWN (1) > DEGRADED (2) > UNAVAILABLE (3)
        const rankMap = {
          [PROVIDER_STATUS.HEALTHY]: 0,
          [PROVIDER_STATUS.UNKNOWN]: 1,
          [PROVIDER_STATUS.DEGRADED]: 2,
          [PROVIDER_STATUS.UNAVAILABLE]: 3,
        };
        const rankA = rankMap[a.healthStatus] ?? 1;
        const rankB = rankMap[b.healthStatus] ?? 1;
        if (rankA !== rankB) return rankA - rankB;

        // Tie-breaker: original seat order
        return a.originalIndex - b.originalIndex;
      });
      const top = ranked[0];
      selectionReason = `Healthiest seat selected (${top.healthStatus}, errorRate: ${(top.errorRate * 100).toFixed(1)}%)`;
      break;
    }

    case ROUTING_POLICY.TASK_BASED: {
      ranked.sort((a, b) => {
        // Capability fit first
        if (a.satisfiesCapabilities !== b.satisfiesCapabilities) return a.satisfiesCapabilities ? -1 : 1;

        // Task affinity score (higher = better)
        if (a.taskScore !== b.taskScore) {
          return b.taskScore - a.taskScore;
        }

        // Avoid unavailable
        if (a.healthStatus === PROVIDER_STATUS.UNAVAILABLE && b.healthStatus !== PROVIDER_STATUS.UNAVAILABLE) return 1;
        if (b.healthStatus === PROVIDER_STATUS.UNAVAILABLE && a.healthStatus !== PROVIDER_STATUS.UNAVAILABLE) return -1;

        return a.originalIndex - b.originalIndex;
      });
      const top = ranked[0];
      selectionReason = `Optimized for task "${taskType || "general"}" (affinity score: ${top.taskScore})`;
      break;
    }

    case ROUTING_POLICY.CAPABILITY: {
      ranked.sort((a, b) => {
        if (a.satisfiesCapabilities !== b.satisfiesCapabilities) return a.satisfiesCapabilities ? -1 : 1;
        return a.originalIndex - b.originalIndex;
      });
      const top = ranked[0];
      selectionReason = `Capability-verified model chosen (matches ${requiredCaps.size} required capabilities)`;
      break;
    }

    case ROUTING_POLICY.PRIORITY:
    default: {
      // Filter out hard failures, but keep original seat priority
      ranked.sort((a, b) => {
        if (a.satisfiesCapabilities !== b.satisfiesCapabilities) return a.satisfiesCapabilities ? -1 : 1;
        if (a.healthStatus === PROVIDER_STATUS.UNAVAILABLE && b.healthStatus !== PROVIDER_STATUS.UNAVAILABLE) return 1;
        if (b.healthStatus === PROVIDER_STATUS.UNAVAILABLE && a.healthStatus !== PROVIDER_STATUS.UNAVAILABLE) return -1;
        return a.originalIndex - b.originalIndex;
      });
      const top = ranked[0];
      selectionReason = `Configured priority seat chosen (${top.healthStatus})`;
      break;
    }
  }

  const selectedCandidate = ranked[0];
  const rankedModelStrings = ranked.map((r) => r.modelIdentifier);

  return {
    selectedModel: selectedCandidate.modelIdentifier,
    rankedModels: rankedModelStrings,
    policyUsed: policy,
    selectionReason,
    decisionMetadata: {
      requestedModel,
      selectedProvider: selectedCandidate.provider,
      selectedModelName: selectedCandidate.model,
      policy,
      taskType: taskType || undefined,
      requiredCapabilities: Array.from(requiredCaps),
      selectedCandidateHealth: selectedCandidate.healthStatus,
      selectedCandidatePricing: selectedCandidate.pricingStatus,
      estimatedCostUSD: selectedCandidate.estimatedCostUSD,
      candidatesEvaluated: candidateScores.length,
    },
  };
}

/**
 * Simulate smart routing decision (Dry-run mode)
 */
export function simulateSmartRoute({
  requestedModel,
  candidateModels,
  policy = ROUTING_POLICY.LOWEST_COST,
  taskType = null,
  body = null,
}) {
  return resolveSmartRoute({
    requestedModel,
    candidateModels,
    policy,
    taskType,
    body,
  });
}
