/**
 * App & Client Analytics Service for Nice Router
 * Aggregates token usage, request counts, errors, and costs
 * strictly per authenticated API key / client application.
 */

import { getAdapter } from "../db/driver.js";
import { getExchangeRate } from "./costIntelligence.js";

function maskApiKey(key) {
  if (!key || typeof key !== "string") return null;
  const trimmed = key.trim();
  if (trimmed.length <= 12) return trimmed.slice(0, 3) + "...";
  return trimmed.slice(0, 7) + "..." + trimmed.slice(-6);
}

/**
 * Get aggregated usage and cost analytics by API Key / Application
 *
 * @param {object} [filter]
 * @param {string} [filter.period] - "today", "24h", "7d", "30d", "60d", "all"
 * @param {string} [filter.startDate]
 * @param {string} [filter.endDate]
 * @returns {Promise<object>} App usage summaries and overview
 */
export async function getAppAnalytics(filter = {}) {
  const db = await getAdapter();
  const { rate: exRate } = await getExchangeRate();

  const conds = [];
  const params = [];

  if (filter.period && !filter.startDate) {
    const now = new Date();
    if (filter.period === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      conds.push("timestamp >= ?");
      params.push(start.toISOString());
    } else if (filter.period === "24h") {
      conds.push("timestamp >= ?");
      params.push(new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
    } else if (filter.period === "7d") {
      conds.push("timestamp >= ?");
      params.push(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
    } else if (filter.period === "30d") {
      conds.push("timestamp >= ?");
      params.push(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());
    } else if (filter.period === "60d") {
      conds.push("timestamp >= ?");
      params.push(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString());
    }
  } else {
    if (filter.startDate) {
      conds.push("timestamp >= ?");
      params.push(new Date(filter.startDate).toISOString());
    }
    if (filter.endDate) {
      conds.push("timestamp <= ?");
      params.push(new Date(filter.endDate).toISOString());
    }
  }

  const whereClause = conds.length ? `WHERE ${conds.join(" AND ")}` : "";

  // Query usage aggregated by apiKey
  const rows = db.all(
    `SELECT
       COALESCE(apiKey, 'unauthenticated') as appKey,
       COUNT(*) as totalRequests,
       SUM(promptTokens) as totalPromptTokens,
       SUM(completionTokens) as totalCompletionTokens,
       SUM(cost) as totalCostUSD,
       MAX(timestamp) as lastUsed,
       SUM(CASE WHEN status != 'ok' AND status != 'success' AND status NOT LIKE '2%' THEN 1 ELSE 0 END) as errorCount
     FROM usageHistory
     ${whereClause}
     GROUP BY appKey
     ORDER BY totalRequests DESC`,
    params
  );

  // Query per-key and per-model breakdown
  let modelRows = [];
  try {
    modelRows = db.all(
      `SELECT
         COALESCE(apiKey, 'unauthenticated') as appKey,
         model,
         provider,
         COUNT(*) as requests,
         SUM(promptTokens) as promptTokens,
         SUM(completionTokens) as completionTokens,
         SUM(cost) as cost
       FROM usageHistory
       ${whereClause}
       GROUP BY appKey, model, provider
       ORDER BY promptTokens DESC`,
      params
    );
  } catch {}

  const modelsByKey = {};
  for (const m of modelRows) {
    if (!modelsByKey[m.appKey]) modelsByKey[m.appKey] = [];
    const costUSD = Number((Number(m.cost) || 0).toFixed(4));
    modelsByKey[m.appKey].push({
      model: m.model,
      provider: m.provider,
      requests: Number(m.requests) || 0,
      promptTokens: Number(m.promptTokens) || 0,
      completionTokens: Number(m.completionTokens) || 0,
      totalTokens: (Number(m.promptTokens) || 0) + (Number(m.completionTokens) || 0),
      costUSD,
      costIDR: Math.round(costUSD * exRate),
    });
  }

  // Map API key metadata from apiKeys table
  let keyMetaMap = {};
  let registeredKeys = [];
  try {
    registeredKeys = db.all(`SELECT id, key, name, machineId, isActive, createdAt FROM apiKeys ORDER BY createdAt ASC`);
    for (const k of registeredKeys) {
      keyMetaMap[k.key] = {
        id: k.id,
        name: k.name || "Default Key",
        machineId: k.machineId || null,
        isActive: k.isActive !== 0,
        createdAt: k.createdAt,
      };
    }
  } catch {}

  const seenKeys = new Set();
  const usageItems = rows.map((r) => {
    seenKeys.add(r.appKey);
    const totalRequests = Number(r.totalRequests) || 0;
    const errorCount = Number(r.errorCount) || 0;
    const promptTokens = Number(r.totalPromptTokens) || 0;
    const completionTokens = Number(r.totalCompletionTokens) || 0;
    const costUSD = Number((Number(r.totalCostUSD) || 0).toFixed(4));
    const costIDR = Math.round(costUSD * exRate);
    const errorRate = totalRequests > 0 ? Number((errorCount / totalRequests).toFixed(4)) : 0;

    const meta = keyMetaMap[r.appKey] || {
      id: null,
      name: r.appKey === "unauthenticated" ? "Local / No Key (Unauthenticated)" : "External / Legacy Key",
      machineId: null,
      isActive: true,
      createdAt: null,
    };

    return {
      appKey: r.appKey,
      appName: meta.name,
      apiKeyMasked: r.appKey === "unauthenticated" ? null : maskApiKey(r.appKey),
      machineId: meta.machineId,
      isActive: meta.isActive,
      createdAt: meta.createdAt,
      lastUsed: r.lastUsed || null,
      totalRequests,
      errorCount,
      errorRate,
      tokens: {
        prompt: promptTokens,
        completion: completionTokens,
        total: promptTokens + completionTokens,
      },
      costUSD,
      costIDR,
      currencyRate: exRate,
      models: modelsByKey[r.appKey] || [],
    };
  });

  // Include registered keys that had 0 requests in this window
  for (const reg of registeredKeys) {
    if (!seenKeys.has(reg.key)) {
      usageItems.push({
        appKey: reg.key,
        appName: reg.name,
        apiKeyMasked: maskApiKey(reg.key),
        machineId: reg.machineId,
        isActive: reg.isActive !== 0,
        createdAt: reg.createdAt,
        lastUsed: null,
        totalRequests: 0,
        errorCount: 0,
        errorRate: 0,
        tokens: { prompt: 0, completion: 0, total: 0 },
        costUSD: 0,
        costIDR: 0,
        currencyRate: exRate,
        models: [],
      });
    }
  }

  // Calculate summary metrics
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalCostUSD = 0;
  let totalRequests = 0;

  for (const item of usageItems) {
    totalPromptTokens += item.tokens.prompt;
    totalCompletionTokens += item.tokens.completion;
    totalCostUSD += item.costUSD;
    totalRequests += item.totalRequests;
  }

  const summary = {
    totalKeys: registeredKeys.length,
    activeKeysInPeriod: rows.filter((r) => r.appKey !== "unauthenticated").length,
    totalRequests,
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens: totalPromptTokens + totalCompletionTokens,
    totalCostUSD: Number(totalCostUSD.toFixed(4)),
    totalCostIDR: Math.round(totalCostUSD * exRate),
    currencyRate: exRate,
  };

  return {
    items: usageItems,
    summary,
  };
}
