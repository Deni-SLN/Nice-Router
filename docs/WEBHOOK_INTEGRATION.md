# Nice Router — Outbound Webhooks Integration & Security Guide

Nice Router v1.2.0 includes a production-grade **Event-Driven Outbound Webhook Engine** with HMAC-SHA256 request signing, automatic retries with exponential backoff, SSRF protection, and persistent delivery logging.

---

## 1. Supported Events

| Event Name | Trigger Condition | Payload Data |
|---|---|---|
| `request.completed` | An AI chat completion or LLM request succeeded | `model`, `provider`, `latencyMs`, `status` |
| `request.failed` | An LLM request returned an upstream error | `model`, `provider`, `statusCode`, `error`, `latencyMs` |
| `provider.unhealthy` | Provider health degraded or became UNAVAILABLE | `provider`, `status`, `previousStatus`, `errorRate`, `lastErrorMessage` |
| `provider.recovered` | Provider recovered back to HEALTHY status | `provider`, `status`, `previousStatus`, `avgLatencyMs` |
| `budget.warning` | Accumulated spend reached warning threshold (e.g. 80%) | `requestedModel`, `reason` |
| `budget.exceeded` | Daily/monthly budget limit reached (blocked/downgraded) | `requestedModel`, `action`, `reason` |
| `pricing.stale` | Currency or pricing cache became stale | `lastUpdated`, `source` |
| `fallback.triggered` | Combo automatic fallback hopped to next model | `comboName`, `failedModel`, `nextModel`, `fallbackCount`, `error` |
| `circuit_breaker.opened` | Circuit breaker tripped for failing provider | `provider`, `reason` |

---

## 2. Webhook Security Architecture

### A. HMAC-SHA256 Signing
Every webhook request is signed with the endpoint's unique secret key. The signature is sent in the `x-nice-signature` header:
```http
POST /your-webhook-endpoint HTTP/1.1
Host: api.yourdomain.com
Content-Type: application/json
User-Agent: Nice-Router-Webhook/1.0
x-nice-event: provider.unhealthy
x-nice-event-id: evt_1778369000_a1b2
x-nice-timestamp: 1778369000123
x-nice-signature: t=1778369000123,v1=9f83...61c
```

#### Verifying Signatures in Node.js:
```javascript
import crypto from "crypto";

export function verifyNiceRouterSignature(payloadString, signatureHeader, secret) {
  // Extract t and v1 from header: t=1778369000123,v1=...
  const match = signatureHeader.match(/t=(\d+),v1=([a-f0-9]+)/);
  if (!match) return false;
  const [, timestamp, receivedSig] = match;

  // Replay check: reject timestamps older than 5 minutes
  if (Math.abs(Date.now() - Number(timestamp)) > 5 * 60 * 1000) {
    return false;
  }

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payloadString}`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig));
}
```

### B. Anti-SSRF Safeguards
- **Private & Loopback IP Blocking**: Webhook destination URLs resolving to `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `::1`, or cloud metadata servers (`169.254.169.254`) are blocked prior to HTTP dispatch.
- **Redirect Hijacking Protection**: Outbound requests reject automatic redirects to unvalidated hosts (`redirect: "manual"`).
- **HTTPS Enforced**: Non-TLS endpoints generate dashboard warnings and are restricted in production mode.

### C. Sensitive Data Redaction
Payloads are strictly sanitized before delivery:
- Raw user prompts, message history, and AI completion texts are never included in default webhook payloads.
- Authentication tokens, API keys, and Authorization headers are automatically redacted.

---

## 3. Retries & Delivery Logging

- **Retry Policy**: Up to 3 attempts with exponential backoff (300ms, 600ms, 1200ms) for transient 5xx errors or network timeouts (5000ms timeout per attempt).
- **Client Errors (4xx)**: Non-retryable; logged immediately as failed without hammering recipient servers.
- **Delivery Logs**: Delivery logs are persisted in SQLite (`webhookDeliveryLogs` table) and accessible in the Dashboard under `Webhooks → Delivery Logs`.
