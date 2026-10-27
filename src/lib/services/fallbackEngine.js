/**
 * Fallback and Retry Engine with Circuit Breaker and Streaming Safeguards
 * for Nice Router
 */

import { getProviderHealth, PROVIDER_STATUS } from "./providerHealthMonitor.js";

// Circuit Breaker State per provider
// CLOSED = Normal operation
// OPEN = Provider failing, short-circuit all requests
// HALF_OPEN = Trial request allowed after cooldown
export const CIRCUIT_STATE = {
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  HALF_OPEN: "HALF_OPEN",
};

const CIRCUIT_COOLDOWN_MS = 30000; // 30 seconds
const circuitStore = new Map();

/**
 * Get or initialize circuit breaker state for a provider
 */
export function getCircuitState(provider) {
  const key = String(provider || "unknown").toLowerCase();
  const now = Date.now();
  if (!circuitStore.has(key)) {
    circuitStore.set(key, {
      state: CIRCUIT_STATE.CLOSED,
      lastStateChange: now,
      trialInFlight: false,
    });
  }

  const record = circuitStore.get(key);
  const health = getProviderHealth(key);

  // If health indicates UNAVAILABLE and not yet marked OPEN
  if (health.status === PROVIDER_STATUS.UNAVAILABLE && record.state === CIRCUIT_STATE.CLOSED) {
    record.state = CIRCUIT_STATE.OPEN;
    record.lastStateChange = now;
  }

  // Check if OPEN cooldown has elapsed -> move to HALF_OPEN
  if (record.state === CIRCUIT_STATE.OPEN && (now - record.lastStateChange) >= CIRCUIT_COOLDOWN_MS) {
    record.state = CIRCUIT_STATE.HALF_OPEN;
    record.lastStateChange = now;
    record.trialInFlight = false;
  }

  // If health recovered to HEALTHY -> CLOSE circuit
  if (health.status === PROVIDER_STATUS.HEALTHY && record.state !== CIRCUIT_STATE.CLOSED) {
    record.state = CIRCUIT_STATE.CLOSED;
    record.lastStateChange = now;
    record.trialInFlight = false;
  }

  return { ...record, provider: key };
}

/**
 * Determine if a request should be allowed through the circuit breaker
 */
export function shouldAllowRequest(provider) {
  const circuit = getCircuitState(provider);
  if (circuit.state === CIRCUIT_STATE.CLOSED) {
    return { allowed: true, state: CIRCUIT_STATE.CLOSED };
  }
  if (circuit.state === CIRCUIT_STATE.HALF_OPEN) {
    // In half-open, allow a trial request
    return { allowed: true, state: CIRCUIT_STATE.HALF_OPEN, isTrial: true };
  }
  // OPEN: short circuit!
  return {
    allowed: false,
    state: CIRCUIT_STATE.OPEN,
    reason: `Circuit breaker OPEN for provider "${provider}". In cooldown period.`,
  };
}

/**
 * Reset circuit breaker states (testing / manual recovery)
 */
export function resetCircuits() {
  circuitStore.clear();
}

/**
 * Calculate exponential backoff delay with jitter and Retry-After support
 *
 * @param {object} params
 * @param {number} params.attempt - 1-based attempt index
 * @param {string|number} [params.retryAfterHeader] - Optional Retry-After HTTP header value
 * @param {number} [params.baseMs=500] - Base delay in ms
 * @param {number} [params.maxMs=5000] - Max delay cap in ms
 * @param {number} [params.jitterRatio=0.2] - Jitter percentage (+/- ratio)
 * @returns {number} Delay in milliseconds
 */
export function calculateBackoffDelay({
  attempt = 1,
  retryAfterHeader = null,
  baseMs = 500,
  maxMs = 5000,
  jitterRatio = 0.2,
}) {
  // If upstream provided Retry-After header
  if (retryAfterHeader !== null && retryAfterHeader !== undefined) {
    const parsedSec = Number(retryAfterHeader);
    if (Number.isFinite(parsedSec) && parsedSec > 0) {
      return Math.min(maxMs, Math.round(parsedSec * 1000));
    }
    // Check if HTTP date format: "Wed, 21 Oct 2026 07:28:00 GMT"
    const dateParsed = Date.parse(String(retryAfterHeader));
    if (!Number.isNaN(dateParsed)) {
      const diffMs = dateParsed - Date.now();
      if (diffMs > 0) {
        return Math.min(maxMs, diffMs);
      }
    }
  }

  // Exponential backoff: base * 2^(attempt - 1)
  const expDelay = baseMs * Math.pow(2, Math.max(0, attempt - 1));
  const cappedDelay = Math.min(maxMs, expDelay);

  // Apply symmetric jitter: cappedDelay * (1 +/- jitterRatio)
  const jitterFactor = 1 + (Math.random() * 2 - 1) * jitterRatio;
  return Math.round(Math.max(0, cappedDelay * jitterFactor));
}

/**
 * Streaming Safeguard:
 * Evaluates whether fallback to another model is safe during an error.
 * If the stream has already started delivering chunks to the client,
 * silent fallback is prohibited to avoid duplicate or scrambled responses.
 *
 * @param {object} params
 * @param {boolean} params.isStreaming - Whether request was a streaming request
 * @param {boolean} params.hasStreamStarted - Whether response stream has begun
 * @param {number} params.chunksEmittedCount - Number of SSE chunks emitted to client
 * @returns {object} { canFallback: boolean, reason: string }
 */
export function canSafelyFallback({
  isStreaming = false,
  hasStreamStarted = false,
  chunksEmittedCount = 0,
}) {
  if (!isStreaming) {
    return { canFallback: true, reason: "Non-streaming request: clean fallback allowed." };
  }

  if (hasStreamStarted || chunksEmittedCount > 0) {
    return {
      canFallback: false,
      reason: `Streaming response has already emitted ${chunksEmittedCount} chunk(s) to client. Fallback aborted to prevent broken/duplicate output.`,
    };
  }

  return {
    canFallback: true,
    reason: "Streaming error occurred before first chunk was delivered; fallback is safe.",
  };
}
