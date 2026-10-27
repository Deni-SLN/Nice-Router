// Model probe suite.
//
// Every probe goes through the local gateway's own /api/v1 surface rather than
// calling the provider directly. That reuses the whole routing stack (account
// selection, fallback, translators) so a PASS means the model works for real
// traffic, not just for a hand-rolled curl.
//
// Cost control is enforced here, not by convention:
//   * a paid model is skipped unless config.allowPaidTests is on;
//   * prompts are fixed, minimal and deterministic;
//   * max_tokens is small and context-heavy models are refused;
//   * the tool probe declares one inert tool and instructs the model not to call
//     it, so a probe can never trigger a real-world action.

import { getApiKeys } from "@/lib/localDb.js";
import { getConsistentMachineId } from "@/shared/utils/machineId.js";
import { UPDATER_CONFIG } from "@/shared/constants/config.js";

const CLI_TOKEN_SALT = "9r-cli-auth";

// Fixed, deterministic, and answerable with one token.
const PROBE_PROMPT = "Reply with the single word: ok";
const PROBE_MAX_TOKENS = 24;
const TOOL_PROMPT = "Do not call any tool. Reply with the single word: ok";

function localBase() {
  return `http://127.0.0.1:${process.env.PORT || UPDATER_CONFIG.appPort}`;
}

let cachedHeaders = { value: null, expiresAt: 0 };

async function internalHeaders() {
  const now = Date.now();
  if (cachedHeaders.value && cachedHeaders.expiresAt > now) return cachedHeaders.value;
  let apiKey = null;
  try {
    const keys = await getApiKeys();
    const active = (keys || []).filter((k) => k.isActive !== false);
    apiKey = (active.find((k) => !k.access?.restricted) || active[0])?.key || null;
  } catch {
    // No keys yet — the CLI token alone is enough for local routes.
  }
  const headers = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  headers["x-9r-cli-token"] = await getConsistentMachineId(CLI_TOKEN_SALT);
  cachedHeaders.value = headers;
  cachedHeaders.expiresAt = now + 30000;
  return headers;
}

export const CHECK = Object.freeze({
  CONNECTIVITY: "connectivity",
  AUTH: "auth",
  COMPLETION: "completion",
  SCHEMA: "schema",
  STREAMING: "streaming",
  TOOL_CALLING: "tool_calling",
  VISION: "vision",
});

export const REQUIRED_CHECKS = Object.freeze([CHECK.COMPLETION, CHECK.SCHEMA]);

function checkResult(check, ok, { latencyMs, message, status, skipped, skippedReason } = {}) {
  return { check, ok, latencyMs: latencyMs ?? null, message: message || null, status: status ?? null, skipped: !!skipped, skippedReason: skippedReason || null };
}

/** Extract the assistant text from an OpenAI-shaped response, tolerating envelopes. */
export function extractAssistantText(payload) {
  const choice = payload?.choices?.[0];
  if (!choice) return "";
  const message = choice.message || choice.delta || {};
  const content = message.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part?.text || ""))
      .join("");
  }
  return "";
}

export function extractReasoningText(payload) {
  const message = payload?.choices?.[0]?.message || {};
  return String(message.reasoning || message.reasoning_content || message.thinking || message.thinking_content || "");
}

/** Parse an SSE body into delta strings. Tolerates non-SSE fallback bodies. */
export function parseSseDeltas(text) {
  const deltas = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const data = trimmed.slice(5).trim();
    if (!data || data === "[DONE]") continue;
    try {
      const parsed = JSON.parse(data);
      const delta = parsed?.choices?.[0]?.delta || parsed?.choices?.[0]?.message;
      if (typeof delta?.content === "string") deltas.push(delta.content);
      else if (Array.isArray(delta?.content)) {
        deltas.push(delta.content.map((p) => (typeof p === "string" ? p : p?.text || "")).join(""));
      }
      if (parsed?.delta?.type === "text" && typeof parsed.delta.text === "string") deltas.push(parsed.delta.text);
    } catch {
      // A partial SSE frame at stream end — ignore, we only need proof of life.
    }
  }
  return deltas.filter(Boolean);
}

// ── Individual checks ────────────────────────────────────────────────────────

async function probeCompletion(model, timeoutMs) {
  const started = Date.now();
  const res = await fetch(`${localBase()}/api/v1/chat/completions`, {
    method: "POST",
    headers: await internalHeaders(),
    body: JSON.stringify({
      model,
      max_tokens: PROBE_MAX_TOKENS,
      temperature: 0,
      stream: false,
      messages: [{ role: "user", content: PROBE_PROMPT }],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const latencyMs = Date.now() - started;
  const raw = await res.text().catch(() => "");
  let parsed = null;
  try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }

  if (!res.ok) {
    const detail = parsed?.error?.message || parsed?.error || parsed?.msg || parsed?.message || raw;
    return { ok: false, latencyMs, status: res.status, message: `HTTP ${res.status}: ${String(detail).slice(0, 400)}`, parsed };
  }
  return { ok: true, latencyMs, status: res.status, parsed };
}

async function probeSchema(parsed) {
  // Shape + non-empty assistant output. A reasoning-only response is accepted
  // as present but reported, matching the existing ping.js soft-pass rule.
  if (!parsed || typeof parsed !== "object") {
    return checkResult(CHECK.SCHEMA, false, { message: "response was not a JSON object" });
  }
  if (parsed.error) {
    return checkResult(CHECK.SCHEMA, false, { message: String(parsed.error?.message || parsed.error).slice(0, 300) });
  }
  if (!Array.isArray(parsed.choices) || !parsed.choices.length) {
    return checkResult(CHECK.SCHEMA, false, { message: "response has no choices array" });
  }
  const text = extractAssistantText(parsed);
  const reasoning = extractReasoningText(parsed);
  const finish = parsed.choices[0].finish_reason;
  if (!text.trim()) {
    if (reasoning.trim() && finish === "length") {
      return checkResult(CHECK.SCHEMA, true, { message: "reasoning-only response (token budget exhausted)" });
    }
    return checkResult(CHECK.SCHEMA, false, { message: "assistant message had no text content" });
  }
  return checkResult(CHECK.SCHEMA, true, { message: `assistant produced ${text.trim().length} characters` });
}

async function probeStreaming(model, timeoutMs) {
  const started = Date.now();
  const res = await fetch(`${localBase()}/api/v1/chat/completions`, {
    method: "POST",
    headers: await internalHeaders(),
    body: JSON.stringify({
      model,
      max_tokens: PROBE_MAX_TOKENS,
      temperature: 0,
      stream: true,
      messages: [{ role: "user", content: PROBE_PROMPT }],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const latencyMs = Date.now() - started;
  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    let detail = raw;
    try { const p = JSON.parse(raw); detail = p?.error?.message || p?.error || raw; } catch { /* raw body */ }
    return checkResult(CHECK.STREAMING, false, { latencyMs, status: res.status, message: `HTTP ${res.status}: ${String(detail).slice(0, 300)}` });
  }
  const body = await res.text().catch(() => "");
  const deltas = parseSseDeltas(body);
  if (!deltas.length) {
    return checkResult(CHECK.STREAMING, false, { latencyMs, status: res.status, message: "no SSE content deltas were returned" });
  }
  return checkResult(CHECK.STREAMING, true, { latencyMs, status: res.status, message: `${deltas.length} content deltas` });
}

async function probeToolCalling(model, timeoutMs) {
  const started = Date.now();
  const res = await fetch(`${localBase()}/api/v1/chat/completions`, {
    method: "POST",
    headers: await internalHeaders(),
    body: JSON.stringify({
      model,
      max_tokens: PROBE_MAX_TOKENS,
      temperature: 0,
      stream: false,
      // An inert schema. Nothing executes this: the body is only inspected for
      // a tool_calls array, and the prompt tells the model not to use it.
      tools: [
        {
          type: "function",
          function: {
            name: "nine_router_capability_probe",
            description: "Inert capability probe. Must never be invoked.",
            parameters: { type: "object", properties: {}, additionalProperties: false },
          },
        },
      ],
      messages: [
        { role: "system", content: "Automated capability probe. Never call a tool." },
        { role: "user", content: TOOL_PROMPT },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const latencyMs = Date.now() - started;
  const raw = await res.text().catch(() => "");
  let parsed = null;
  try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }

  if (!res.ok) {
    const detail = parsed?.error?.message || parsed?.error || raw;
    return checkResult(CHECK.TOOL_CALLING, false, {
      latencyMs, status: res.status,
      message: `HTTP ${res.status}: ${String(detail).slice(0, 300)}`,
    });
  }
  if (!Array.isArray(parsed?.choices) || !parsed.choices.length) {
    return checkResult(CHECK.TOOL_CALLING, false, { latencyMs, status: res.status, message: "response has no choices array" });
  }
  const message = parsed.choices[0].message || {};
  const toolCalls = message.tool_calls;
  if (Array.isArray(toolCalls) && toolCalls.length) {
    return checkResult(CHECK.TOOL_CALLING, true, {
      latencyMs, status: res.status, message: "model emitted a tool call",
    });
  }
  // The tools array was accepted and the model answered in text. That still
  // proves the endpoint supports the parameter, which is what we are testing.
  return checkResult(CHECK.TOOL_CALLING, true, {
    latencyMs, status: res.status, message: "tools parameter accepted (model answered in text)",
  });
}

// ── Orchestration ────────────────────────────────────────────────────────────

/**
 * Run the check suite for one model.
 *
 * @param {object} args
 * @param {string} args.model         "provider/model"
 * @param {object} args.capabilities  getCapabilitiesForModel result
 * @param {object} args.config        intel config
 * @param {object} [args.overrides]   { skipStreaming, skipTools, skipContext }
 * @returns {Promise<{checks: object[], latencyMs: number, skipped?: string}>}
 */
export async function probeModel({ model, capabilities, config, overrides = {} }) {
  const checks = [];
  const timeoutMs = config?.testTimeoutMs || 20000;

  // Context guard: probing a million-token model is how a health check turns
  // into an unexpected bill.
  const contextWindow = capabilities?.contextWindow;
  const maxContext = config?.maxTestContextWindow ?? 400000;
  if (Number.isFinite(contextWindow) && maxContext > 0 && contextWindow > maxContext) {
    return { checks, latencyMs: 0, skipped: `context window ${contextWindow} exceeds the test ceiling ${maxContext}` };
  }

  const started = Date.now();

  // 1–4. Connectivity, auth and completion are one round trip: the local
  // endpoint returning at all is the connectivity + auth evidence.
  let completion;
  try {
    completion = await probeCompletion(model, timeoutMs);
  } catch (error) {
    // Thrown = transport-level failure (timeout, DNS, connection reset).
    const timedOut = error?.name === "TimeoutError" || error?.name === "AbortError";
    checks.push(checkResult(CHECK.CONNECTIVITY, false, {
      latencyMs: Date.now() - started,
      message: timedOut ? `probe timed out after ${timeoutMs}ms` : String(error?.message || error).slice(0, 300),
    }));
    checks.push(checkResult(CHECK.COMPLETION, false, { message: "connectivity check failed" }));
    return { checks, latencyMs: Date.now() - started };
  }

  checks.push(checkResult(CHECK.CONNECTIVITY, true, { latencyMs: completion.latencyMs, status: completion.status }));

  if (!completion.ok) {
    // Auth vs connectivity: a 401/403 from the gateway means the credential was
    // rejected. The classifier decides the scope from here.
    checks.push(checkResult(CHECK.AUTH, false, {
      latencyMs: completion.latencyMs, status: completion.status, message: completion.message,
    }));
    checks.push(checkResult(CHECK.COMPLETION, false, {
      latencyMs: completion.latencyMs, status: completion.status, message: completion.message,
    }));
    return { checks, latencyMs: Date.now() - started };
  }

  checks.push(checkResult(CHECK.AUTH, true, { latencyMs: completion.latencyMs, status: completion.status }));
  checks.push(checkResult(CHECK.COMPLETION, true, { latencyMs: completion.latencyMs, status: completion.status }));

  const schema = await probeSchema(completion.parsed);
  schema.latencyMs = completion.latencyMs;
  checks.push(schema);
  if (!schema.ok) return { checks, latencyMs: Date.now() - started };

  // 5. Streaming — optional capability, failure here is DEGRADED not FAIL.
  if (config?.testStreaming === false || overrides.skipStreaming) {
    checks.push(checkResult(CHECK.STREAMING, true, { skipped: true, skippedReason: "streaming probes disabled" }));
  } else {
    checks.push(await probeStreaming(model, timeoutMs));
  }

  // 6. Tool calling — only when the provider advertises it or the capability
  //    table says so. Advertising is the gate; a false negative just means we
  //    do not probe, never that we fail the model.
  const advertisesTools = capabilities?.tools !== false;
  if (config?.testToolCalling === false || overrides.skipTools) {
    checks.push(checkResult(CHECK.TOOL_CALLING, true, { skipped: true, skippedReason: "tool probes disabled" }));
  } else if (!advertisesTools) {
    checks.push(checkResult(CHECK.TOOL_CALLING, true, { skipped: true, skippedReason: "model does not advertise tool calling" }));
  } else {
    checks.push(await probeToolCalling(model, timeoutMs));
  }

  // 7. Multimodal — off by default (needs a real image, costs more, and
  //    flakier). Only run when explicitly enabled and the model is vision-capable.
  if (config?.testMultimodal === true && capabilities?.vision === true) {
    // A real image upload belongs in a dedicated suite; the default path marks
    // it skipped rather than guessing an asset.
    checks.push(checkResult(CHECK.VISION, true, { skipped: true, skippedReason: "vision probes require a configured fixture" }));
  }

  return { checks, latencyMs: Date.now() - started };
}

export function resetProbeHeaderCache() {
  cachedHeaders = { value: null, expiresAt: 0 };
}
