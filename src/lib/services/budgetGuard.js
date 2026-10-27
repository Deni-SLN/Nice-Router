/**
 * Budget Guard Engine for Nice Router
 * Manages daily/monthly budget limits, per-key quotas,
 * warning thresholds, and policy actions (warning, block, downgrade).
 */

import { PRICING_STATUS } from "./costIntelligence.js";

export const BUDGET_ACTION = {
  WARNING: "warning",
  BLOCK: "block",
  DOWNGRADE: "downgrade",
};

export const DEFAULT_BUDGET_CONFIG = {
  dailyLimitUSD: null,       // null = unlimited
  monthlyLimitUSD: null,     // null = unlimited
  warningThresholdRatio: 0.8, // 80% threshold triggers warning
  defaultAction: BUDGET_ACTION.WARNING,
  approvedFreeModel: "openrouter/google/gemini-2.0-flash-exp:free",
  conservativeCostForUnknownUSD: 0.05, // Conservative estimate if price is unknown
  keyLimitsUSD: {},          // { [apiKey]: { dailyLimitUSD, monthlyLimitUSD, action } }
};

let currentConfig = { ...DEFAULT_BUDGET_CONFIG };

/**
 * Configure budget parameters
 */
export function setBudgetConfig(newConfig) {
  currentConfig = {
    ...currentConfig,
    ...newConfig,
    keyLimitsUSD: {
      ...currentConfig.keyLimitsUSD,
      ...(newConfig?.keyLimitsUSD || {}),
    },
  };
  scheduleBudgetPersist();
  return { ...currentConfig };
}

/**
 * Get active budget configuration
 */
export function getBudgetConfig() {
  return { ...currentConfig };
}

/**
 * Evaluate request against budget guards
 *
 * @param {object} params
 * @param {string} [params.apiKey] - API key identifier
 * @param {string} params.requestedModel - Model requested
 * @param {string} params.pricingStatus - PRICING_STATUS enum
 * @param {number} params.estimatedCostUSD - Estimated request cost in USD
 * @param {number} [params.currentDaySpendUSD=0] - Total USD spent today across router
 * @param {number} [params.currentMonthSpendUSD=0] - Total USD spent this month across router
 * @param {number} [params.currentKeyDaySpendUSD=0] - Total USD spent today by this key
 * @param {number} [params.currentKeyMonthSpendUSD=0] - Total USD spent this month by this key
 * @returns {object} Decision { allowed, action, targetModel, reason, warningTriggered }
 */
export function evaluateBudgetGuard({
  apiKey = null,
  requestedModel,
  pricingStatus = PRICING_STATUS.PRICED,
  estimatedCostUSD = 0,
  currentDaySpendUSD = 0,
  currentMonthSpendUSD = 0,
  currentKeyDaySpendUSD = 0,
  currentKeyMonthSpendUSD = 0,
}) {
  // If request is confirmed FREE, allow unconditionally
  if (pricingStatus === PRICING_STATUS.FREE) {
    return {
      allowed: true,
      action: null,
      targetModel: requestedModel,
      reason: "Confirmed FREE model: exempt from budget restriction.",
      warningTriggered: false,
    };
  }

  // Determine effective cost estimate
  let effectiveCost = Number.isFinite(estimatedCostUSD) && estimatedCostUSD >= 0 ? estimatedCostUSD : 0;
  if (pricingStatus === PRICING_STATUS.UNKNOWN_PRICE || pricingStatus === PRICING_STATUS.UNMAPPED_MODEL) {
    effectiveCost = currentConfig.conservativeCostForUnknownUSD;
  }

  // Check per-key limits first if configured
  const keyConfig = apiKey && currentConfig.keyLimitsUSD[apiKey];
  if (keyConfig) {
    const keyAction = keyConfig.action || currentConfig.defaultAction;

    // Daily key check
    if (keyConfig.dailyLimitUSD && (currentKeyDaySpendUSD + effectiveCost) > keyConfig.dailyLimitUSD) {
      return applyLimitAction(keyAction, requestedModel, `Daily limit of $${keyConfig.dailyLimitUSD} exceeded for this API key.`);
    }

    // Monthly key check
    if (keyConfig.monthlyLimitUSD && (currentKeyMonthSpendUSD + effectiveCost) > keyConfig.monthlyLimitUSD) {
      return applyLimitAction(keyAction, requestedModel, `Monthly limit of $${keyConfig.monthlyLimitUSD} exceeded for this API key.`);
    }
  }

  // Global daily limit check
  if (currentConfig.dailyLimitUSD && (currentDaySpendUSD + effectiveCost) > currentConfig.dailyLimitUSD) {
    return applyLimitAction(currentConfig.defaultAction, requestedModel, `Global daily budget limit ($${currentConfig.dailyLimitUSD}) exceeded.`);
  }

  // Global monthly limit check
  if (currentConfig.monthlyLimitUSD && (currentMonthSpendUSD + effectiveCost) > currentConfig.monthlyLimitUSD) {
    return applyLimitAction(currentConfig.defaultAction, requestedModel, `Global monthly budget limit ($${currentConfig.monthlyLimitUSD}) exceeded.`);
  }

  // Check warning thresholds
  let warningTriggered = false;
  let warningMessage = null;

  if (currentConfig.dailyLimitUSD) {
    const dailyRatio = (currentDaySpendUSD + effectiveCost) / currentConfig.dailyLimitUSD;
    if (dailyRatio >= currentConfig.warningThresholdRatio) {
      warningTriggered = true;
      warningMessage = `Warning: Daily spending has reached ${(dailyRatio * 100).toFixed(1)}% of $${currentConfig.dailyLimitUSD}.`;
    }
  }

  return {
    allowed: true,
    action: warningTriggered ? BUDGET_ACTION.WARNING : null,
    targetModel: requestedModel,
    reason: warningMessage || "Within budget limits.",
    warningTriggered,
  };
}

function applyLimitAction(action, requestedModel, reason) {
  if (action === BUDGET_ACTION.BLOCK) {
    return {
      allowed: false,
      action: BUDGET_ACTION.BLOCK,
      targetModel: null,
      reason: `Request blocked by Budget Guard: ${reason}`,
      warningTriggered: true,
    };
  }

  if (action === BUDGET_ACTION.DOWNGRADE) {
    const freeModel = currentConfig.approvedFreeModel;
    return {
      allowed: true,
      action: BUDGET_ACTION.DOWNGRADE,
      targetModel: freeModel,
      reason: `Budget limit reached: automatically downgraded from ${requestedModel} to approved free model ${freeModel}.`,
      warningTriggered: true,
    };
  }

  // Default: WARNING only
  return {
    allowed: true,
    action: BUDGET_ACTION.WARNING,
    targetModel: requestedModel,
    reason: `Budget warning: ${reason} (Policy set to warning only).`,
    warningTriggered: true,
  };
}

let budgetKv = null;
async function getBudgetKv() {
  if (!budgetKv) {
    try {
      const { makeKv } = await import("../db/helpers/kvStore.js");
      budgetKv = makeKv("budget_guard");
    } catch {
      budgetKv = null;
    }
  }
  return budgetKv;
}

export async function persistBudgetConfig() {
  try {
    const store = await getBudgetKv();
    if (!store) return;
    await store.set("config", currentConfig);
  } catch {}
}

export async function restoreBudgetConfig() {
  try {
    const store = await getBudgetKv();
    if (!store) return;
    const saved = await store.get("config", null);
    if (saved && typeof saved === "object") {
      currentConfig = {
        ...DEFAULT_BUDGET_CONFIG,
        ...saved,
      };
    }
  } catch {}
}

let budgetPersistTimeout = null;
export function scheduleBudgetPersist() {
  if (budgetPersistTimeout) return;
  budgetPersistTimeout = setTimeout(async () => {
    budgetPersistTimeout = null;
    await persistBudgetConfig().catch(() => {});
  }, 500);
}
