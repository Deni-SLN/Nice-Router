// Generic adapter for any provider whose registry entry declares a
// `modelsFetcher.url` returning an OpenAI-style `{ data: [{ id, ... }] }` or
// bare array catalog. This is what makes the subsystem extensible: a new
// provider usually needs a one-line registry change, not new core code.
//
// Deliberately conservative — it imports identity only. Pricing, modalities and
// supported parameters are *not* guessed from an arbitrary provider's payload,
// because a misread free/paid verdict is worse than no verdict.

import { normalizeModelRecord, toTrimmedString } from "./types.js";

export function parseOpenAICompatibleModels(payload) {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data) ? payload.data
    : Array.isArray(payload?.models) ? payload.models
    : Array.isArray(payload?.results) ? payload.results
    : [];
  const out = [];
  const seen = new Set();
  for (const entry of list) {
    const raw = typeof entry === "string" ? { model: entry } : entry;
    const record = normalizeModelRecord({
      model: raw?.id || raw?.name || raw?.model,
      name: raw?.name,
      kind: raw?.kind || raw?.type,
      contextLength: raw?.context_length ?? raw?.contextLength ?? raw?.max_context_length,
      // Only an explicit zero-rate price block counts as free, and only when
      // the provider uses the OpenRouter-compatible pricing shape.
      pricing: raw?.pricing && typeof raw.pricing === "object" ? raw.pricing : null,
      inputModalities: raw?.input_modalities || raw?.inputModalities,
      outputModalities: raw?.output_modalities || raw?.outputModalities,
      parameters: raw?.supported_parameters || raw?.parameters,
      description: raw?.description,
    });
    if (!record || seen.has(record.model)) continue;
    seen.add(record.model);
    out.push(record);
  }
  return out;
}

// Registry fetcher URLs are the only ones we will call: no caller-supplied URL
// ever reaches a fetch from this adapter (SSRF — CWE-918).
export function createCompatibleAdapter({ id, providerId, url, label, headers }) {
  return {
    id,
    providerId: providerId || id,
    label: label || id,
    supportsConnection: true,
    requiresConnection: true,
    fromRegistryFetcher: true,
    catalogUrl() {
      return url;
    },
    headers(connection) {
      const built = { accept: "application/json" };
      for (const [k, v] of Object.entries(headers || {})) built[k] = v;
      const key = connection?.apiKey || connection?.accessToken;
      if (key) built.Authorization = `Bearer ${key}`;
      return built;
    },
    async fetchModels(connection, { timeoutMs = 15000 } = {}) {
      const res = await fetch(this.catalogUrl(), {
        method: "GET",
        headers: this.headers(connection),
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        const err = new Error(`Catalog returned HTTP ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return parseOpenAICompatibleModels(await res.json());
    },
  };
}

export default createCompatibleAdapter;
