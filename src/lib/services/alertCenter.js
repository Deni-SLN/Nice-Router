/**
 * Alert Center with Deduplication for Nice Router
 * Handles deduplicated operational alerts for:
 * - Provider downtime / UNAVAILABLE
 * - High rate limits (HTTP 429)
 * - Budget limit warnings and breaches
 * - Circuit breaker trips
 * - Authentication failures
 */

export const ALERT_SEVERITY = {
  INFO: "INFO",
  WARNING: "WARNING",
  CRITICAL: "CRITICAL",
};

export const ALERT_CATEGORY = {
  PROVIDER_DOWN: "PROVIDER_DOWN",
  RATE_LIMIT_BURST: "RATE_LIMIT_BURST",
  BUDGET_BREACH: "BUDGET_BREACH",
  CIRCUIT_TRIPPED: "CIRCUIT_TRIPPED",
  AUTH_FAILURE: "AUTH_FAILURE",
};

const DEDUPLICATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const alertStore = new Map(); // Key: fingerprint

function buildFingerprint(category, target) {
  return `${category}:${String(target || "global").toLowerCase()}`;
}

/**
 * Record an alert with deduplication
 *
 * @param {object} params
 * @param {string} params.category - ALERT_CATEGORY enum
 * @param {string} params.severity - ALERT_SEVERITY enum
 * @param {string} params.target - Affected provider, model, API key, or "global"
 * @param {string} params.message - Human-readable alert description
 * @param {object} [params.metadata] - Extra contextual details
 * @returns {object} The recorded or updated alert
 */
export function recordAlert({
  category,
  severity = ALERT_SEVERITY.WARNING,
  target = "global",
  message,
  metadata = {},
}) {
  const fingerprint = buildFingerprint(category, target);
  const now = new Date().toISOString();
  const nowMs = Date.now();

  const existing = alertStore.get(fingerprint);
  if (existing && (nowMs - existing.lastOccurredMs) < DEDUPLICATION_WINDOW_MS) {
    // Deduplicate: increment count and update timestamp
    existing.occurrenceCount += 1;
    existing.lastOccurredAt = now;
    existing.lastOccurredMs = nowMs;
    existing.message = message; // Keep latest message
    existing.metadata = { ...existing.metadata, ...metadata };
    existing.isResolved = false;
    return { ...existing };
  }

  const alertId = `alert-${nowMs}-${Math.random().toString(36).substring(2, 7)}`;
  const newAlert = {
    id: alertId,
    fingerprint,
    category,
    severity,
    target,
    message,
    firstOccurredAt: now,
    lastOccurredAt: now,
    lastOccurredMs: nowMs,
    occurrenceCount: 1,
    isResolved: false,
    metadata,
  };

  alertStore.set(fingerprint, newAlert);
  scheduleAlertPersist();
  return { ...newAlert };
}

/**
 * Get active or recent alerts
 *
 * @param {object} [filter]
 * @param {number} [filter.limit=50]
 * @param {string} [filter.severity]
 * @param {boolean} [filter.unresolvedOnly=false]
 * @returns {object[]}
 */
export function getAlerts({ limit = 50, severity = null, unresolvedOnly = false } = {}) {
  let list = Array.from(alertStore.values());

  if (unresolvedOnly) {
    list = list.filter((a) => !a.isResolved);
  }
  if (severity) {
    list = list.filter((a) => a.severity === severity);
  }

  // Sort by lastOccurredMs descending
  list.sort((a, b) => b.lastOccurredMs - a.lastOccurredMs);
  return list.slice(0, limit);
}

/**
 * Mark an alert as resolved
 */
export function resolveAlert(alertId) {
  for (const [key, alert] of alertStore.entries()) {
    if (alert.id === alertId) {
      alert.isResolved = true;
      alert.resolvedAt = new Date().toISOString();
      return true;
    }
  }
  return false;
}

/**
 * Reset all alerts (for testing)
 */
export function clearAlerts() {
  alertStore.clear();
}

let alertKv = null;
async function getAlertKv() {
  if (!alertKv) {
    try {
      const { makeKv } = await import("../db/helpers/kvStore.js");
      alertKv = makeKv("alert_center");
    } catch {
      alertKv = null;
    }
  }
  return alertKv;
}

export async function persistAlertsState() {
  try {
    const store = await getAlertKv();
    if (!store) return;
    const dump = Array.from(alertStore.values());
    await store.set("alerts", dump);
  } catch {}
}

export async function restoreAlertsState() {
  try {
    const store = await getAlertKv();
    if (!store) return;
    const dump = await store.get("alerts", []);
    if (Array.isArray(dump)) {
      for (const a of dump) {
        if (a && a.id && !alertStore.has(a.fingerprint || a.id)) {
          alertStore.set(a.fingerprint || a.id, a);
        }
      }
    }
  } catch {}
}

let alertPersistTimeout = null;
export function scheduleAlertPersist() {
  if (alertPersistTimeout) return;
  alertPersistTimeout = setTimeout(async () => {
    alertPersistTimeout = null;
    await persistAlertsState().catch(() => {});
  }, 1000);
}
