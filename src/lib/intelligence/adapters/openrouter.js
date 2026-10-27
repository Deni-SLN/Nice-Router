// OpenRouter model discovery.
//
// GET https://openrouter.ai/api/v1/models returns the full catalog as
// `{ data: [...] }`. The endpoint is public, but sending the configured API key
// when one is available gives the account's own entitled set. Never required.
//
// Response limits: OpenRouter returns the whole catalog in one response and
// documents no pagination for this endpoint. `fetchAll` still pages defensively
// via ?limit/?offset and stops when a short page comes back, so a future
// paginated variant keeps working without touching this file.

import { normalizeModelRecord, toFiniteNumber, toTrimmedString } from "./types.js";

export const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const PAGE_SIZE = 200;
const MAX_PAGES = 40;

// OpenRouter reports prices as decimal strings per token. Treat any missing or
// non-numeric dimension as unknown rather than zero, so a partial price object
// can never be mistaken for a free model.
function parsePricing(raw) {
  if (!raw || typeof raw !== "object") return null;
  const num = (v) => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    prompt: num(raw.prompt),
    completion: num(raw.completion),
    request: num(raw.request),
    image: num(raw.image),
    audio: num(raw.audio),
    web_search: num(raw.web_search),
  };
}

function parseArchitecture(model) {
  const arch = model?.architecture || {};
  const input = Array.isArray(arch.input_modalities) ? arch.input_modalities : [];
  const output = Array.isArray(arch.output_modalities) ? arch.output_modalities : [];
  return {
    inputModalities: input.filter((m) => typeof m === "string"),
    outputModalities: output.filter((m) => typeof m === "string"),
  };
}

// supported_parameters carries the advertised capability list. Tool calling and
// structured output are advertised explicitly on most models; the presence of
// the key is the signal, not the model name.
const TOOL_PARAMS = new Set([
  "tools", "tool_choice", "parallel_tool_calls", "response_format", "structured_outputs",
]);
const VISION_MODALITIES = new Set(["image", "image_url"]);
const AUDIO_INPUT = new Set(["audio"]);

function kindFromModalities(input, output) {
  const inSet = new Set(input);
  const outSet = new Set(output);
  const textIn = inSet.has("text");
  const textOut = outSet.has("text");
  if (textIn && textOut) return "llm";
  if (!textIn && !textOut && inSet.has("image") && outSet.has("text")) return "imageToText";
  if (textIn && !textOut && outSet.has("image")) return "image";
  if (textIn && !textOut && outSet.has("audio")) return "tts";
  if (textIn && outSet.has("file")) return "stt";
  return "llm";
}

export function parseOpenRouterModels(payload) {
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  const out = [];
  const seen = new Set();
  for (const entry of list) {
    const id = toTrimmedString(entry?.id, 300);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const { inputModalities, outputModalities } = parseArchitecture(entry);
    const params = Array.isArray(entry?.supported_parameters)
      ? entry.supported_parameters.filter((p) => typeof p === "string")
      : [];
    out.push(normalizeModelRecord({
      model: id,
      name: entry?.name || id,
      kind: kindFromModalities(inputModalities, outputModalities),
      contextLength: toFiniteNumber(entry?.context_length),
      maxOutput: toFiniteNumber(entry?.top_provider?.max_completion_tokens ?? entry?.max_completion_tokens),
      inputModalities,
      outputModalities,
      parameters: params,
      pricing: parsePricing(entry?.pricing),
      description: toTrimmedString(entry?.description, 1000),
      created: toFiniteNumber(entry?.created),
      topProvider: toTrimmedString(entry?.top_provider?.provider_name, 120),
      endpointAvailable: true,
      // Advertised capabilities, kept alongside the raw metadata so the health
      // probe can decide whether a tool-calling check is relevant.
      tools: params.some((p) => TOOL_PARAMS.has(p)),
      vision: inputModalities.some((m) => VISION_MODALITIES.has(m)),
      audioInput: inputModalities.some((m) => AUDIO_INPUT.has(m)),
    }));
  }
  return out.filter(Boolean);
}

async function fetchJson(url, headers, timeoutMs) {
  const res = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json", ...headers },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const err = new Error(`OpenRouter /models returned HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const openrouterAdapter = {
  id: "openrouter",
  label: "OpenRouter",
  supportsConnection: true,
  requiresConnection: false,

  catalogUrl() {
    return OPENROUTER_MODELS_URL;
  },

  // The key is optional here. Send it when we have one so the response reflects
  // the account's entitlements, but a public fetch must still work.
  headers(connection) {
    const headers = { "HTTP-Referer": "https://9router.local", "X-Title": "9Router" };
    const key = connection?.apiKey || connection?.accessToken;
    if (key) headers.Authorization = `Bearer ${key}`;
    return headers;
  },

  async fetchModels(connection, { timeoutMs = 20000 } = {}) {
    const models = [];
    const seen = new Set();
    for (let page = 0; page < MAX_PAGES; page++) {
      const base = this.catalogUrl(connection);
      const url = new URL(base);
      url.searchParams.set("limit", String(PAGE_SIZE));
      url.searchParams.set("offset", String(page * PAGE_SIZE));
      const payload = await fetchJson(url.toString(), this.headers(connection), timeoutMs);
      const batch = parseOpenRouterModels(payload);
      const fresh = batch.filter((m) => !seen.has(m.model));
      for (const m of fresh) seen.add(m.model);
      models.push(...fresh);
      // A short page means the catalog is exhausted. `fresh` being empty also
      // terminates the loop against a server that ignores paging.
      if (batch.length < PAGE_SIZE || fresh.length === 0) break;
    }
    return models;
  },
};

export default openrouterAdapter;
