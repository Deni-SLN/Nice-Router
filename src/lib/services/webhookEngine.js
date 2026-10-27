import crypto from "crypto";
import dns from "dns/promises";
import {
  getActiveWebhooksForEvent,
  saveDeliveryLog,
  getWebhookById,
} from "../db/repos/webhooksRepo.js";

export const WEBHOOK_EVENTS = {
  REQUEST_COMPLETED: "request.completed",
  REQUEST_FAILED: "request.failed",
  PROVIDER_UNHEALTHY: "provider.unhealthy",
  PROVIDER_RECOVERED: "provider.recovered",
  BUDGET_WARNING: "budget.warning",
  BUDGET_EXCEEDED: "budget.exceeded",
  PRICING_STALE: "pricing.stale",
  FALLBACK_TRIGGERED: "fallback.triggered",
  CIRCUIT_BREAKER_OPENED: "circuit_breaker.opened",
};

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_PAYLOAD_BYTES = 64 * 1024; // 64KB max payload size

/**
 * Checks if an IP address belongs to private/loopback/cloud-metadata ranges
 */
export function isPrivateOrReservedIp(ip) {
  if (!ip || typeof ip !== "string") return true;
  const cleanIp = ip.trim().toLowerCase();

  // IPv6 checks
  if (cleanIp === "::1" || cleanIp === "::" || cleanIp.startsWith("fe80:") || cleanIp.startsWith("fc") || cleanIp.startsWith("fd")) {
    return true;
  }

  // IPv4 checks
  const parts = cleanIp.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return true;
  }

  const [a, b] = parts;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;
  // 10.0.0.0/8 (Private)
  if (a === 10) return true;
  // 172.16.0.0/12 (Private)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata e.g. 169.254.169.254)
  if (a === 169 && b === 254) return true;

  return false;
}

/**
 * Validates a destination URL against SSRF rules.
 * Resolves DNS to ensure destination does not resolve to private IP.
 */
export async function validateWebhookUrl(urlStr, allowLocal = false) {
  let parsed;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { valid: false, reason: "Malformed URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, reason: "Invalid protocol: only http and https are permitted" };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Explicit check for local bypass flag (for local testing/dev)
  const isLocalBypass = allowLocal || process.env.ALLOW_LOCAL_WEBHOOKS === "true";

  if (!isLocalBypass) {
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return { valid: false, reason: "Localhost and loopback destinations are restricted" };
    }

    try {
      const addresses = await dns.lookup(hostname, { all: true });
      for (const addr of addresses) {
        if (isPrivateOrReservedIp(addr.address)) {
          return {
            valid: false,
            reason: `Target hostname resolves to reserved/private IP: ${addr.address}`,
          };
        }
      }
    } catch (err) {
      return { valid: false, reason: `DNS resolution failed: ${err.message}` };
    }
  }

  return { valid: true, parsed };
}

/**
 * Generates an HMAC-SHA256 signature for a webhook payload
 */
export function signPayload(payloadString, secret, timestamp) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${timestamp}.${payloadString}`);
  return hmac.digest("hex");
}

/**
 * Redacts sensitive fields from webhook data payloads
 */
export function redactSensitiveData(data) {
  if (!data || typeof data !== "object") return data;
  const clone = { ...data };

  // Remove credentials, keys, raw prompts, authorization headers
  const sensitiveKeys = [
    "authorization",
    "apiKey",
    "key",
    "password",
    "secret",
    "token",
    "credentials",
    "messages",
    "prompt",
    "responseBody",
  ];

  for (const k of Object.keys(clone)) {
    if (sensitiveKeys.some((s) => k.toLowerCase().includes(s.toLowerCase()))) {
      delete clone[k];
    }
  }

  return clone;
}

/**
 * Deliver a webhook event to a specific endpoint with retries and HMAC signing
 */
export async function deliverWebhook({
  webhook,
  event,
  eventId,
  timestamp,
  data = {},
  maxAttempts = 3,
  allowLocal = false,
}) {
  const sanitizedData = redactSensitiveData(data);
  const envelope = {
    id: eventId,
    event,
    timestamp,
    data: sanitizedData,
  };

  const payloadString = JSON.stringify(envelope);
  if (Buffer.byteLength(payloadString) > MAX_PAYLOAD_BYTES) {
    await saveDeliveryLog({
      webhookId: webhook.id,
      eventId,
      event,
      statusCode: null,
      success: false,
      attempts: 0,
      durationMs: 0,
      error: `Payload exceeded maximum allowed size (${MAX_PAYLOAD_BYTES} bytes)`,
    });
    return { success: false, error: "Payload size limit exceeded" };
  }

  // SSRF validation
  const validation = await validateWebhookUrl(webhook.url, allowLocal);
  if (!validation.valid) {
    await saveDeliveryLog({
      webhookId: webhook.id,
      eventId,
      event,
      statusCode: null,
      success: false,
      attempts: 0,
      durationMs: 0,
      error: `SSRF Blocked: ${validation.reason}`,
    });
    return { success: false, error: validation.reason };
  }

  const signature = signPayload(payloadString, webhook.secret, timestamp);
  let attempt = 0;
  let lastError = null;
  let lastStatus = null;
  const startTime = Date.now();

  while (attempt < maxAttempts) {
    attempt++;
    const attemptStart = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Nice-Router-Webhook/1.0",
          "x-nice-event": event,
          "x-nice-event-id": eventId,
          "x-nice-timestamp": String(timestamp),
          "x-nice-signature": `t=${timestamp},v1=${signature}`,
        },
        body: payloadString,
        redirect: "manual", // Prevent automatic unvalidated redirects
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      lastStatus = response.status;

      // Handle redirect safety: do not follow redirects blindly
      if (response.status >= 300 && response.status < 400) {
        lastError = `Redirect to ${response.headers.get("location")} rejected by policy`;
        break; // Do not retry redirects
      }

      const durationMs = Date.now() - attemptStart;
      if (response.ok) {
        await saveDeliveryLog({
          webhookId: webhook.id,
          eventId,
          event,
          statusCode: response.status,
          success: true,
          attempts: attempt,
          durationMs,
          error: null,
        });
        return { success: true, statusCode: response.status, attempts: attempt, durationMs };
      }

      // 4xx errors (client errors) are non-retryable
      if (response.status >= 400 && response.status < 500) {
        lastError = `HTTP ${response.status}: Client error (no retry)`;
        break;
      }

      // 5xx errors: transient, retryable
      lastError = `HTTP ${response.status}: Upstream server error`;
    } catch (err) {
      lastError = err.name === "AbortError" ? "Delivery timed out (5000ms)" : err.message;
    }

    // Exponential backoff before next attempt: 300ms, 600ms, etc.
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 300 * Math.pow(2, attempt - 1)));
    }
  }

  const totalDurationMs = Date.now() - startTime;
  await saveDeliveryLog({
    webhookId: webhook.id,
    eventId,
    event,
    statusCode: lastStatus,
    success: false,
    attempts: attempt,
    durationMs: totalDurationMs,
    error: lastError,
  });

  return { success: false, statusCode: lastStatus, attempts: attempt, error: lastError };
}

/**
 * Dispatch an event to all active subscribed webhooks
 */
export async function dispatchWebhookEvent(event, data = {}) {
  try {
    const activeWebhooks = await getActiveWebhooksForEvent(event);
    if (!activeWebhooks || activeWebhooks.length === 0) return [];

    const eventId = `evt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const timestamp = Date.now();

    // Fire in parallel
    const promises = activeWebhooks.map((wh) =>
      deliverWebhook({
        webhook: wh,
        event,
        eventId,
        timestamp,
        data,
      }).catch((err) => ({
        success: false,
        error: err.message,
      }))
    );

    return await Promise.all(promises);
  } catch (err) {
    console.warn("[webhookEngine] dispatchWebhookEvent error:", err.message);
    return [];
  }
}

/**
 * Send a test ping event to a specific webhook endpoint
 */
export async function sendTestWebhookPing(webhookId, allowLocal = false) {
  const webhook = await getWebhookById(webhookId, true);
  if (!webhook) {
    return { success: false, error: "Webhook not found" };
  }

  const eventId = `evt_test_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
  const timestamp = Date.now();

  return await deliverWebhook({
    webhook,
    event: "test.ping",
    eventId,
    timestamp,
    data: {
      message: "Test webhook notification from Nice Router",
      routerVersion: "1.0.0",
      status: "operational",
    },
    maxAttempts: 1,
    allowLocal,
  });
}
