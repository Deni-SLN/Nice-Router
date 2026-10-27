// Provider adapter contract for model discovery.
//
// An adapter turns a provider's catalog endpoint into a normalized list of
// model records. Adding a provider means writing one file and registering it in
// ./index.js — the sync engine, the store and the API never change.
//
// Adapter shape:
//   {
//     id: string,                 // matches the provider id / alias used in URLs
//     label?: string,
//     supportsConnection?: bool,  // needs a stored connection to authenticate
//     catalogUrl(connection): string,
//     headers(connection): object,
//     parse(payload, context): Array<NormalizedModel>,
//   }
//
// NormalizedModel:
//   {
//     model: string,              // upstream id, preserved verbatim
//     name?: string,
//     kind?: "llm"|"embedding"|"image"|"tts"|"stt"|"video"|"imageToText",
//     contextLength?: number,
//     maxOutput?: number,
//     inputModalities?: string[],  // ["text","image","audio","pdf","video"]
//     outputModalities?: string[], // ["text","image","audio","video"]
//     parameters?: string[],       // supported_parameters, best-effort
//     pricing?: { prompt, completion, request, image, audio, web_search },
//     isFree?: boolean,            // metadata-confirmed, never inferred from the name
//     freeReason?: string,
//     description?: string,
//     created?: number,
//     topProvider?: string,
//     endpointAvailable?: boolean, // provider exposes an endpoint for this model
//   }

export const MODEL_KINDS = Object.freeze([
  "llm", "embedding", "image", "tts", "stt", "video", "imageToText", "systemone",
]);

export const INPUT_MODALITY_KEYS = Object.freeze([
  "vision", "pdf", "audioInput", "videoInput",
]);

// Map a normalized modality list onto the capability flags capabilities.js uses.
export function modalitiesToCaps(inputModalities = [], outputModalities = []) {
  const inSet = new Set(inputModalities.map((m) => String(m).toLowerCase()));
  const outSet = new Set(outputModalities.map((m) => String(m).toLowerCase()));
  const caps = {};
  if (inSet.has("image")) caps.vision = true;
  if (inSet.has("pdf") || inSet.has("file")) caps.pdf = true;
  if (inSet.has("audio")) caps.audioInput = true;
  if (inSet.has("video")) caps.videoInput = true;
  if (outSet.has("image")) caps.imageOutput = true;
  if (outSet.has("audio")) caps.audioOutput = true;
  if (outSet.has("video")) caps.videoOutput = true;
  return caps;
}

/** Free means every billed dimension is zero. A missing dimension is unknown. */
export function pricingIsFree(pricing) {
  if (!pricing || typeof pricing !== "object") return false;
  const dims = ["prompt", "completion", "request", "image", "audio", "web_search"];
  let sawBilled = false;
  for (const dim of dims) {
    const raw = pricing[dim];
    if (raw === undefined || raw === null || raw === "") continue;
    const value = Number(raw);
    if (!Number.isFinite(value)) continue;
    sawBilled = true;
    if (value !== 0) return false;
  }
  // No pricing at all is not evidence of free.
  return sawBilled;
}

export function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function toTrimmedString(value, max = 400) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

/** Validate + normalize one parsed record. Returns null when unusable. */
export function normalizeModelRecord(raw, { defaultKind = "llm" } = {}) {
  if (!raw || typeof raw !== "object") return null;
  const model = toTrimmedString(raw.model || raw.id, 300);
  if (!model) return null;

  const kind = MODEL_KINDS.includes(raw.kind) ? raw.kind : defaultKind;
  const pricing = raw.pricing && typeof raw.pricing === "object"
    ? {
        prompt: raw.pricing.prompt ?? null,
        completion: raw.pricing.completion ?? null,
        request: raw.pricing.request ?? null,
        image: raw.pricing.image ?? null,
        audio: raw.pricing.audio ?? null,
        web_search: raw.pricing.web_search ?? null,
      }
    : null;

  // isFree is only set from the provider's own pricing metadata, and only when
  // a price block was actually published. An id ending in ":free" is a hint we
  // verify elsewhere, never a conclusion — see freeTier.js.
  const pricingSaysFree = pricingIsFree(pricing);
  const isFree = raw.isFree === true ? true
    : raw.isFree === false ? false
      : pricing ? pricingSaysFree
        : undefined;

  return {
    model,
    name: toTrimmedString(raw.name, 300) || model,
    kind,
    contextLength: toFiniteNumber(raw.contextLength),
    maxOutput: toFiniteNumber(raw.maxOutput),
    inputModalities: Array.isArray(raw.inputModalities)
      ? raw.inputModalities.filter((m) => typeof m === "string").slice(0, 16)
      : undefined,
    outputModalities: Array.isArray(raw.outputModalities)
      ? raw.outputModalities.filter((m) => typeof m === "string").slice(0, 16)
      : undefined,
    parameters: Array.isArray(raw.parameters)
      ? raw.parameters.filter((p) => typeof p === "string").slice(0, 128)
      : undefined,
    pricing,
    isFree,
    freeReason: toTrimmedString(raw.freeReason, 200),
    description: toTrimmedString(raw.description, 1000),
    created: toFiniteNumber(raw.created),
    topProvider: toTrimmedString(raw.topProvider, 120),
    endpointAvailable: raw.endpointAvailable !== false,
    // Capabilities the provider advertises. Kept distinct from the capability
    // table in capabilities.js: this is what the provider *says*, and the probe
    // in probe.js uses it to decide whether a tool-calling check is relevant.
    advertisedTools: raw.tools === true ? true : undefined,
    advertisedVision: raw.vision === true ? true : undefined,
    advertisedAudioInput: raw.audioInput === true ? true : undefined,
  };
}
