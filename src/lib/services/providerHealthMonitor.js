/**
 * Provider Health Monitor for Nice Router
 * Tracks real-time connection status, rolling latency (avg & p95),
 * error rates, HTTP 429 rate limits, and 5xx failures per provider.
 */

export const PROVIDER_STATUS = {
  HEALTHY: "HEALTHY",         // Low error rate, normal latency
  DEGRADED: "DEGRADED",       // Higher error rate, recent 429 rate limit, or high latency
  UNAVAILABLE: "UNAVAILABLE", // Consecutive failures, authentication error, or connection down
  UNKNOWN: "UNKNOWN",         // Not yet probed or insufficient traffic
};

const ROLLING_WINDOW_SIZE = 50;
const DEGRADED_LATENCY_THRESHOLD_MS = 8000;
const DEGRADED_ERROR_RATE_THRESHOLD = 0.25; // 25%
const UNAVAILABLE_STREAK_THRESHOLD = 3;

// In-memory health store per provider
// Key: providerName (lowercase)
const providerMetrics = new Map();

function getOrCreateMetric(provider) {
  const key = String(provider || "unknown").toLowerCase();
  if (!providerMetrics.has(key)) {
    providerMetrics.set(key, {
      provider: key,
      totalRequests: 0,
      successCount: 0,
      errorCount: 0,
      rateLimitCount: 0, // HTTP 429
      serverErrorCount: 0, // HTTP 5xx
      authErrorCount: 0, // HTTP 401/403
      consecutiveErrors: 0,
      latencies: [], // Rolling window of response times in ms
      avgLatencyMs: 0,
      p95LatencyMs: 0,
      lastSuccessAt: null,
      lastErrorAt: null,
      lastErrorMessage: null,
      lastCheckAt: null,
      status: PROVIDER_STATUS.UNKNOWN,
    });
  }
  return providerMetrics.get(key);
}

function calculateP95(latencies) {
  if (!latencies || latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil(0.95 * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function computeStatus(metric) {
  // If zero requests or just 1 unconfirmed error without history
  if (metric.totalRequests === 0) {
    return PROVIDER_STATUS.UNKNOWN;
  }

  // Auth failures or consecutive critical errors = UNAVAILABLE
  if (metric.authErrorCount > 0 && metric.consecutiveErrors >= 1) {
    return PROVIDER_STATUS.UNAVAILABLE;
  }
  if (metric.consecutiveErrors >= UNAVAILABLE_STREAK_THRESHOLD) {
    return PROVIDER_STATUS.UNAVAILABLE;
  }

  // Calculate rolling error rate from last N requests (or total if < N)
  const windowRequests = Math.min(metric.totalRequests, ROLLING_WINDOW_SIZE);
  const recentErrorRate = metric.errorCount / Math.max(1, metric.totalRequests);

  // Recent 429 within 60 seconds -> DEGRADED
  const hasRecent429 = (
    metric.rateLimitCount > 0 &&
    metric.lastErrorAt &&
    (Date.now() - new Date(metric.lastErrorAt).getTime()) < 60000
  );

  if (hasRecent429 || recentErrorRate >= DEGRADED_ERROR_RATE_THRESHOLD || metric.p95LatencyMs >= DEGRADED_LATENCY_THRESHOLD_MS) {
    return PROVIDER_STATUS.DEGRADED;
  }

  if (metric.successCount > 0) {
    return PROVIDER_STATUS.HEALTHY;
  }

  return PROVIDER_STATUS.UNKNOWN;
}

/**
 * Record a completed provider request result
 *
 * @param {object} params
 * @param {string} params.provider
 * @param {boolean} params.success
 * @param {number} params.latencyMs
 * @param {number} [params.httpStatus]
 * @param {string} [params.errorMessage]
 */
export function recordProviderMetric({
  provider,
  success,
  latencyMs = 0,
  httpStatus = 200,
  errorMessage = null,
}) {
  const m = getOrCreateMetric(provider);
  const now = new Date().toISOString();

  m.totalRequests += 1;
  m.lastCheckAt = now;

  // Add latency
  if (Number.isFinite(latencyMs) && latencyMs >= 0) {
    m.latencies.push(latencyMs);
    if (m.latencies.length > ROLLING_WINDOW_SIZE) {
      m.latencies.shift();
    }
    const sum = m.latencies.reduce((acc, v) => acc + v, 0);
    m.avgLatencyMs = Math.round(sum / m.latencies.length);
    m.p95LatencyMs = calculateP95(m.latencies);
  }

  if (success) {
    m.successCount += 1;
    m.consecutiveErrors = 0;
    m.lastSuccessAt = now;
  } else {
    m.errorCount += 1;
    m.consecutiveErrors += 1;
    m.lastErrorAt = now;
    m.lastErrorMessage = errorMessage ? String(errorMessage).slice(0, 300) : `HTTP ${httpStatus}`;

    if (httpStatus === 429) {
      m.rateLimitCount += 1;
    } else if (httpStatus === 401 || httpStatus === 403) {
      m.authErrorCount += 1;
    } else if (httpStatus >= 500 && httpStatus <= 599) {
      m.serverErrorCount += 1;
    }
  }

  m.status = computeStatus(m);
  return { ...m };
}

/**
 * Get current health snapshot for a single provider
 */
export function getProviderHealth(provider) {
  const key = String(provider || "").toLowerCase();
  const m = providerMetrics.get(key);
  if (!m) {
    return {
      provider: key,
      status: PROVIDER_STATUS.UNKNOWN,
      totalRequests: 0,
      avgLatencyMs: 0,
      p95LatencyMs: 0,
      errorRate: 0,
      lastCheckAt: null,
    };
  }

  const errorRate = m.totalRequests > 0 ? Number((m.errorCount / m.totalRequests).toFixed(4)) : 0;
  return {
    ...m,
    errorRate,
  };
}

/**
 * Get all provider health metrics summary (for dashboard or routing decisions)
 */
export function getAllProvidersHealth() {
  const summary = {};
  for (const [provider, metric] of providerMetrics.entries()) {
    const errorRate = metric.totalRequests > 0 ? Number((metric.errorCount / metric.totalRequests).toFixed(4)) : 0;
    summary[provider] = {
      ...metric,
      errorRate,
    };
  }
  return summary;
}

/**
 * Reset health metrics (e.g. for testing or manual provider reconnect)
 */
export function resetProviderHealth(provider = null) {
  if (provider) {
    providerMetrics.delete(String(provider).toLowerCase());
  } else {
    providerMetrics.clear();
  }
}
