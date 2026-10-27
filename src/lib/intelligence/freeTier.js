// Free-tier classification.
//
// Rule: free status comes from provider pricing metadata or an adapter's
// explicit confirmation — never from the model name. `":free"` in an id is a
// strong hint that we *verify*, not a conclusion: plenty of gateways reuse the
// suffix for rate-limited-but-billed variants, and a paid model labelled free
// is the expensive mistake.
//
// A model with no pricing information anywhere is `unknown`, which sorts with
// paid in Free Only mode so an unpriced model can never be billed by accident.

import { getPricingForModel as resolveConstPricing, ZERO_PRICING } from "open-sse/providers/pricing.js";
import { pricingIsFree } from "./adapters/types.js";

export const FREE_STATUS = Object.freeze({
  FREE: "free",
  PAID: "paid",
  UNKNOWN: "unknown",
});

const PAID_MODEL_CATEGORIES = new Set(["image", "tts", "video"]);

// Dimensions a provider can bill on. cache_read/cache_write are excluded: a
// gateway that quotes only cache pricing has still told us nothing about the
// token price.
const BILLED_DIMENSIONS = ["prompt", "completion", "request", "image", "audio", "web_search"];

/** True when the provider published at least one finite, non-empty price. */
function hasBilledDimension(pricing) {
  if (!pricing || typeof pricing !== "object") return false;
  return BILLED_DIMENSIONS.some((dim) => {
    const raw = pricing[dim];
    if (raw === undefined || raw === null || raw === "") return false;
    return Number.isFinite(Number(raw));
  });
}
function normalizedPricingFor(adapterMeta) {
  const pricing = adapterMeta?.pricing;
  if (!pricing || typeof pricing !== "object") return null;
  return pricing;
}

function constPricingIsFree(pricing) {
  if (!pricing) return false;
  const values = [pricing.input, pricing.output, pricing.cached, pricing.reasoning, pricing.cache_creation];
  const present = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (!present.length) return false;
  return present.every((v) => v === 0);
}

/**
 * @param {object} args
 * @param {string} args.provider
 * @param {string} args.model
 * @param {object} [args.adapterMeta] - metadata stored by the last catalog sync
 * @param {object} [args.capabilities] - result of getCapabilitiesForModel
 * @returns {{ status: string, isFree: boolean, reason: string, price: object|null }}
 */
export function classifyFreeTier({ provider, model, adapterMeta, capabilities } = {}) {
  const meta = adapterMeta || {};
  const adapterPricing = normalizedPricingFor(meta);
  const contextWindow = capabilities?.contextWindow;

  // Non-text modalities (image/video/tts) are billed per generation and their
  // price is not comparable to a token rate. Report them as paid-unless-proven
  // so Free Only cannot pick one up on a missing price.
  const kind = meta.kind || capabilities?.kind;
  if (PAID_MODEL_CATEGORIES.has(kind) && !pricingIsFree(adapterPricing)) {
    return { status: FREE_STATUS.PAID, isFree: false, reason: "billed per generation", price: adapterPricing || null };
  }

  // 1. Adapter said free / not free explicitly.
  if (meta.isFree === true) {
    return { status: FREE_STATUS.FREE, isFree: true, reason: meta.freeReason || "provider pricing metadata", price: adapterPricing || null };
  }
  if (meta.isFree === false) {
    return { status: FREE_STATUS.PAID, isFree: false, reason: meta.freeReason || "provider pricing metadata", price: adapterPricing || null };
  }

  // 2. Provider pricing metadata says every billed dimension is zero.
  if (pricingIsFree(adapterPricing)) {
    return { status: FREE_STATUS.FREE, isFree: true, reason: "zero-rate provider pricing", price: adapterPricing };
  }

  // 2b. The provider quoted a real price. That is positive evidence of PAID, not
  // an absence of evidence — important because Free Only sorts UNKNOWN with
  // PAID, and the dashboard should not claim ignorance it does not have.
  if (hasBilledDimension(adapterPricing)) {
    return {
      status: FREE_STATUS.PAID,
      isFree: false,
      reason: "provider quotes a non-zero price",
      price: adapterPricing,
    };
  }

  // 3. The id carries a free marker AND the provider quoted a real price.
  //    Record the disagreement so the diagnostics page can explain the verdict.
  //    With no price quoted at all the marker proves nothing, so fall through.
  if (adapterPricing && isFreeMarker(model)) {
    return {
      status: FREE_STATUS.PAID,
      isFree: false,
      reason: "id is marked free but the provider quotes a non-zero price",
      price: adapterPricing,
    };
  }

  // 4. Fall back to the hand-written pricing tables (constants + user overrides).
  let constPricing = null;
  try {
    const dbPricing = resolveConstPricing(provider, model);
    constPricing = dbPricing || null;
  } catch {
    constPricing = null;
  }
  if (constPricing && constPricing !== ZERO_PRICING && constPricingIsFree(constPricing)) {
    return { status: FREE_STATUS.FREE, isFree: true, reason: "zero-rate pricing table", price: constPricing };
  }
  if (constPricing && constPricing !== ZERO_PRICING) {
    return { status: FREE_STATUS.PAID, isFree: false, reason: "priced in pricing table", price: constPricing };
  }

  // 5. Known free-tier provider with no per-model pricing published: the provider
  //    states the whole account is free-tier, which is a positive claim from the
  //    provider rather than a guess from the name.
  if (meta.providerIsFreeTier === true) {
    return { status: FREE_STATUS.FREE, isFree: true, reason: "free-tier provider", price: adapterPricing || null };
  }

  return {
    status: FREE_STATUS.UNKNOWN,
    isFree: false,
    reason: adapterPricing ? "pricing metadata present but not free" : "no pricing information",
    price: adapterPricing || null,
    contextWindow,
  };
}

const FREE_MARKER = /:free$/i;

export function isFreeMarker(model) {
  return typeof model === "string" && FREE_MARKER.test(model);
}
