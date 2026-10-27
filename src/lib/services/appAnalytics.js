/**
 * App & Client Analytics Service for Nice Router
 * Aggregates token usage, request counts, errors, and costs
 * strictly per authenticated API key / client application.
 */

import { getAdapter } from "../db/driver.js";
import { parseJson } from "../db/helpers/jsonCol.js";
import { getExchangeRate, DEFAULT_USD_IDR_RATE } from "./costIntelligence.js";

/**
 * Get aggregated usage and cost analytics by API Key / Application
 *
 * @param {object} [filter]
 * @param {string} [filter.startDate]
 * @param {string} [filter.endDate]
 * @returns {Promise<object[]>} Array of app usage summaries
 */
export async function getAppAnalytics(filter = {}) {
  const db = await getAdapter();
  const { rate: exRate } = await getExchangeRate();

  const conds = [];
  const params = [];

  if (filter.startDate) {
    conds.push("timestamp >= ?");
    params.push(new Date(filter.startDate).toISOString());
  }
  if (filter.endDate) {
    conds.push("timestamp <= ?");
    params.push(new Date(filter.endDate).toISOString());
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
       SUM(CASE WHEN status != 'ok' AND status != 'success' AND status NOT LIKE '2%' THEN 1 ELSE 0 END) as errorCount
     FROM usageHistory
     ${whereClause}
     GROUP BY appKey
     ORDER BY totalRequests DESC`,
    params
  );

  // Map API key metadata (name, machineId) from apiKeys table
  let keyMetaMap = {};
  try {
    const keys = db.all(`SELECT key, name, machineId FROM apiKeys`);
    for (const k of keys) {
      keyMetaMap[k.key] = { name: k.name || "Default Key", machineId: k.machineId || null };
    }
  } catch {}

  return rows.map((r) => {
    const totalRequests = Number(r.totalRequests) || 0;
    const errorCount = Number(r.errorCount) || 0;
    const promptTokens = Number(r.totalPromptTokens) || 0;
    const completionTokens = Number(r.totalCompletionTokens) || 0;
    const costUSD = Number((Number(r.totalCostUSD) || 0).toFixed(4));
    const costIDR = Math.round(costUSD * exRate);
    const errorRate = totalRequests > 0 ? Number((errorCount / totalRequests).toFixed(4)) : 0;

    const meta = keyMetaMap[r.appKey] || { name: r.appKey === "unauthenticated" ? "Local / No Key" : "External Key", machineId: null };

    return {
      appKey: r.appKey,
      appName: meta.name,
      machineId: meta.machineId,
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
    };
  });
}
