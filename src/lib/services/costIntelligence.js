/**
 * Cost Intelligence Engine for Nice Router
 * Handles pricing resolution, status categorization, currency conversion,
 * and token cost computation with double-counting prevention.
 */

import { getPricingForModel, ZERO_PRICING, isFreeModel } from "open-sse/providers/pricing.js";

export const PRICING_STATUS = {
  FREE: "FREE",                     // Confirmed $0 upstream or free-tier
  PRICED: "PRICED",                 // Pricing known, reliable token cost computed
  UNKNOWN_PRICE: "UNKNOWN_PRICE",   // Model recognized or requested, but rate unknown
  UNMAPPED_MODEL: "UNMAPPED_MODEL", // Model not mapped to catalog
  UNMETERED: "UNMETERED",           // Tokens missing or unmeterable by provider
};

export const DEFAULT_USD_IDR_RATE = 16300;

let cachedExchangeRate = {
  rate: DEFAULT_USD_IDR_RATE,
  lastUpdated: new Date().toISOString(),
  source: "default",
};

/**
 * Get current USD to IDR exchange rate
 */
export async function getExchangeRate() {
  try {
    const { getSettings } = await import("../db/repos/settingsRepo.js");
    const settings = await getSettings();
    if (settings && Number(settings.usdToIdrRate) > 0) {
      return {
        rate: Number(settings.usdToIdrRate),
        lastUpdated: settings.usdToIdrUpdatedAt || cachedExchangeRate.lastUpdated,
        source: settings.usdToIdrSource || "settings",
      };
    }
  } catch {
    // Fall back to memory cache if DB is not ready or during isolated testing
  }
  return cachedExchangeRate;
}

/**
 * Update USD to IDR exchange rate in database and memory
 */
export async function updateExchangeRate(newRate, source = "manual") {
  const parsedRate = Number(newRate);
  if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
    throw new Error("Invalid exchange rate: must be a positive number");
  }

  const now = new Date().toISOString();
  cachedExchangeRate = {
    rate: parsedRate,
    lastUpdated: now,
    source,
  };

  try {
    const { updateSettings } = await import("../db/repos/settingsRepo.js");
    await updateSettings({
      usdToIdrRate: parsedRate,
      usdToIdrUpdatedAt: now,
      usdToIdrSource: source,
    });
  } catch (e) {
    console.warn("[costIntelligence] Could not persist exchange rate to settingsRepo:", e.message);
  }

  return cachedExchangeRate;
}

/**
 * Resolves model pricing status and rate definitions
 *
 * @param {string} provider
 * @param {string} model
 * @param {object} [userPricingOverride]
 * @returns {object} { status, pricing, source }
 */
export function resolveModelPricingStatus(provider, model, userPricingOverride = null) {
  if (!model) {
    return { status: PRICING_STATUS.UNMAPPED_MODEL, pricing: null, source: "none" };
  }

  // 1. Check user pricing override first
  if (userPricingOverride && typeof userPricingOverride === "object") {
    const isZero = (
      userPricingOverride.input === 0 &&
      userPricingOverride.output === 0 &&
      (!userPricingOverride.cached || userPricingOverride.cached === 0)
    );
    if (isZero && userPricingOverride.isFree) {
      return { status: PRICING_STATUS.FREE, pricing: ZERO_PRICING, source: "user_override_free" };
    }
    if (Number.isFinite(userPricingOverride.input) && Number.isFinite(userPricingOverride.output)) {
      return { status: PRICING_STATUS.PRICED, pricing: userPricingOverride, source: "user_override" };
    }
  }

  // 2. Check if known free model (free namespace, e.g. cline-free/, or openrouter :free)
  const isFree = isFreeModel(model) || String(model).toLowerCase().endsWith(":free") || String(model).toLowerCase().includes("/free");
  if (isFree) {
    return { status: PRICING_STATUS.FREE, pricing: ZERO_PRICING, source: "upstream_free" };
  }

  // 3. Check official provider / canonical pricing catalog
  const catalogPricing = getPricingForModel(provider, model);
  if (catalogPricing) {
    const allZero = (
      catalogPricing.input === 0 &&
      catalogPricing.output === 0 &&
      (!catalogPricing.cached || catalogPricing.cached === 0)
    );
    if (allZero) {
      return { status: PRICING_STATUS.FREE, pricing: ZERO_PRICING, source: "catalog_free" };
    }
    return { status: PRICING_STATUS.PRICED, pricing: catalogPricing, source: "catalog_pricing" };
  }

  // 4. Distinguish between unmapped and unknown
  if (!provider && !model.includes("/")) {
    return { status: PRICING_STATUS.UNMAPPED_MODEL, pricing: null, source: "unmapped" };
  }

  return { status: PRICING_STATUS.UNKNOWN_PRICE, pricing: null, source: "unknown" };
}

function sanitizeTokenCount(val) {
  const n = Number(val);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.floor(n);
}

/**
 * Calculate token cost with explicit status, currency conversion,
 * and double-counting prevention.
 *
 * @param {object} params
 * @param {string} params.provider
 * @param {string} params.model
 * @param {object} params.tokens - Token usage object
 * @param {object} [params.pricingOverride]
 * @param {number} [params.customExchangeRate]
 * @returns {object} Cost result with status, USD & IDR values, and breakdown
 */
export function calculateCostWithStatus({
  provider,
  model,
  tokens,
  pricingOverride = null,
  customExchangeRate = null,
}) {
  const rate = customExchangeRate || cachedExchangeRate.rate || DEFAULT_USD_IDR_RATE;

  // Check if tokens exist and are metered
  const hasTokens = tokens && typeof tokens === "object";
  const promptTokens = hasTokens ? sanitizeTokenCount(tokens.prompt_tokens || tokens.input_tokens) : 0;
  const completionTokens = hasTokens ? sanitizeTokenCount(tokens.completion_tokens || tokens.output_tokens) : 0;
  const cachedTokens = hasTokens ? sanitizeTokenCount(tokens.cached_tokens || tokens.cache_read_input_tokens) : 0;
  const cacheCreationTokens = hasTokens ? sanitizeTokenCount(tokens.cache_creation_input_tokens) : 0;
  const reasoningTokens = hasTokens ? sanitizeTokenCount(tokens.reasoning_tokens) : 0;

  const totalReportedTokens = promptTokens + completionTokens;
  const isMetered = hasTokens && totalReportedTokens > 0;

  // Resolve pricing status
  const { status, pricing, source } = resolveModelPricingStatus(provider, model, pricingOverride);

  // If unmetered tokens on a paid model, mark UNMETERED
  if (!isMetered && status === PRICING_STATUS.PRICED) {
    return {
      status: PRICING_STATUS.UNMETERED,
      costUSD: null,
      costIDR: null,
      currencyRate: rate,
      source,
      isMetered: false,
      tokensUsed: { prompt: 0, completion: 0, cached: 0, reasoning: 0, cacheCreation: 0 },
      breakdown: { inputCostUSD: 0, outputCostUSD: 0, cachedCostUSD: 0, reasoningCostUSD: 0, cacheCreationCostUSD: 0 },
    };
  }

  // Model confirmed FREE
  if (status === PRICING_STATUS.FREE) {
    return {
      status: PRICING_STATUS.FREE,
      costUSD: 0,
      costIDR: 0,
      currencyRate: rate,
      source,
      isMetered,
      tokensUsed: {
        prompt: promptTokens,
        completion: completionTokens,
        cached: cachedTokens,
        reasoning: reasoningTokens,
        cacheCreation: cacheCreationTokens,
      },
      breakdown: { inputCostUSD: 0, outputCostUSD: 0, cachedCostUSD: 0, reasoningCostUSD: 0, cacheCreationCostUSD: 0 },
    };
  }

  // Model price unknown or unmapped -> DO NOT claim $0.00!
  if (status === PRICING_STATUS.UNKNOWN_PRICE || status === PRICING_STATUS.UNMAPPED_MODEL) {
    return {
      status,
      costUSD: null,
      costIDR: null,
      currencyRate: rate,
      source,
      isMetered,
      tokensUsed: {
        prompt: promptTokens,
        completion: completionTokens,
        cached: cachedTokens,
        reasoning: reasoningTokens,
        cacheCreation: cacheCreationTokens,
      },
      breakdown: null,
    };
  }

  // Calculate costs with pricing rates (per 1,000,000 tokens)
  // Input tokens: prompt_tokens is cache-inclusive in canonicalizeUsage convention,
  // so subtract cached + cache_creation to prevent double-charging full input rate.
  const nonCachedInput = Math.max(0, promptTokens - cachedTokens - cacheCreationTokens);
  const inputRate = Number(pricing.input || 0);
  const cachedRate = Number(pricing.cached ?? pricing.input ?? 0);
  const cacheCreationRate = Number(pricing.cache_creation ?? pricing.input ?? 0);
  const outputRate = Number(pricing.output || 0);
  const reasoningRate = Number(pricing.reasoning ?? pricing.output ?? 0);

  const inputCostUSD = (nonCachedInput * inputRate) / 1000000;
  const cachedCostUSD = (cachedTokens * cachedRate) / 1000000;
  const cacheCreationCostUSD = (cacheCreationTokens * cacheCreationRate) / 1000000;

  // Safeguard against reasoning double counting:
  // In OpenAI/standard format, `completion_tokens` already includes `reasoning_tokens`.
  // If a separate reasoningRate is specified and differs from outputRate:
  // we charge regular output tokens at outputRate, and reasoning tokens at reasoningRate.
  let outputCostUSD = 0;
  let reasoningCostUSD = 0;

  if (reasoningTokens > 0 && reasoningRate !== outputRate) {
    const regularOutputTokens = Math.max(0, completionTokens - reasoningTokens);
    outputCostUSD = (regularOutputTokens * outputRate) / 1000000;
    reasoningCostUSD = (reasoningTokens * reasoningRate) / 1000000;
  } else {
    // Reasoning billed at standard output rate (or 0 reasoning tokens)
    outputCostUSD = (completionTokens * outputRate) / 1000000;
    reasoningCostUSD = 0;
  }

  const totalCostUSD = inputCostUSD + cachedCostUSD + cacheCreationCostUSD + outputCostUSD + reasoningCostUSD;
  const totalCostIDR = totalCostUSD * rate;

  return {
    status: PRICING_STATUS.PRICED,
    costUSD: Number(totalCostUSD.toFixed(6)),
    costIDR: Math.round(totalCostIDR),
    currencyRate: rate,
    source,
    isMetered,
    tokensUsed: {
      prompt: promptTokens,
      completion: completionTokens,
      cached: cachedTokens,
      reasoning: reasoningTokens,
      cacheCreation: cacheCreationTokens,
    },
    breakdown: {
      inputCostUSD: Number(inputCostUSD.toFixed(6)),
      outputCostUSD: Number(outputCostUSD.toFixed(6)),
      cachedCostUSD: Number(cachedCostUSD.toFixed(6)),
      reasoningCostUSD: Number(reasoningCostUSD.toFixed(6)),
      cacheCreationCostUSD: Number(cacheCreationCostUSD.toFixed(6)),
    },
  };
}

/**
 * Format currency for display
 */
export function formatCostFormatted(costUSD, currency = "USD", rate = DEFAULT_USD_IDR_RATE) {
  if (costUSD === null || costUSD === undefined || isNaN(costUSD)) {
    return "-";
  }
  if (costUSD === 0) {
    return currency === "IDR" ? "Rp 0" : "$0.00";
  }
  if (currency === "IDR") {
    const idrVal = Math.round(costUSD * rate);
    return `Rp ${idrVal.toLocaleString("id-ID")}`;
  }
  if (costUSD < 0.01) {
    return `$${costUSD.toFixed(4)}`;
  }
  return `$${costUSD.toFixed(2)}`;
}
