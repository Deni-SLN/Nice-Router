// Error classification.
//
// The whole suppression feature stands or falls on this file. A dead API key, a
// provider outage and a genuinely broken model all surface as "the request
// failed", but only one of them says anything about the model. Getting this
// wrong marks every model on a provider FAIL because someone rotated a token.
//
// SCOPE decides what may change a model's health:
//   MODEL     — the model itself is implicated; only this can fail a model
//   ACCOUNT   — the credential, plan or quota is implicated; health untouched
//   PROVIDER  — the upstream service is implicated; health untouched

export const SCOPE = Object.freeze({
  MODEL: "MODEL",
  ACCOUNT: "ACCOUNT",
  PROVIDER: "PROVIDER",
  UNKNOWN: "UNKNOWN",
});

export const CATEGORY = Object.freeze({
  // account-scoped
  AUTH_INVALID: "auth_invalid",
  FORBIDDEN: "forbidden",
  QUOTA_EXHAUSTED: "quota_exhausted",
  RATE_LIMITED: "rate_limited",
  // provider-scoped
  PROVIDER_OUTAGE: "provider_outage",
  UPSTREAM_OVERLOADED: "upstream_overloaded",
  NETWORK: "network",
  TIMEOUT: "timeout",
  // model-scoped
  MODEL_NOT_FOUND: "model_not_found",
  MODEL_UNSUPPORTED_PARAM: "model_unsupported_param",
  MODEL_NO_OUTPUT: "model_no_output",
  MODEL_CONTENT_FILTER: "model_content_filter",
  MODEL_BAD_SCHEMA: "model_bad_schema",
  // unclassified
  UNKNOWN: "unknown",
});

const ACCOUNT_CATEGORIES = new Set([
  CATEGORY.AUTH_INVALID, CATEGORY.FORBIDDEN, CATEGORY.QUOTA_EXHAUSTED, CATEGORY.RATE_LIMITED,
]);
const PROVIDER_CATEGORIES = new Set([
  CATEGORY.PROVIDER_OUTAGE, CATEGORY.UPSTREAM_OVERLOADED, CATEGORY.NETWORK, CATEGORY.TIMEOUT,
]);
const MODEL_CATEGORIES = new Set([
  CATEGORY.MODEL_NOT_FOUND, CATEGORY.MODEL_UNSUPPORTED_PARAM, CATEGORY.MODEL_NO_OUTPUT,
  CATEGORY.MODEL_CONTENT_FILTER, CATEGORY.MODEL_BAD_SCHEMA,
]);

export function scopeForCategory(category) {
  if (ACCOUNT_CATEGORIES.has(category)) return SCOPE.ACCOUNT;
  if (PROVIDER_CATEGORIES.has(category)) return SCOPE.PROVIDER;
  if (MODEL_CATEGORIES.has(category)) return SCOPE.MODEL;
  return SCOPE.UNKNOWN;
}

/**
 * True only for failures that are evidence about the model itself. Everything
 * else must leave the health state alone — an ambiguous result is UNKNOWN, not
 * FAIL (Phase 3 requirement).
 */
export function isModelScoped(category) {
  return scopeForCategory(category) === SCOPE.MODEL;
}

function text(value, max = 600) {
  if (value == null) return "";
  const s = typeof value === "string" ? value : JSON.stringify(value);
  return (s || "").toLowerCase().slice(0, max);
}

// Order matters: the first matching rule wins, so the more specific signals are
// listed before the broad HTTP-status fallbacks.
const RULES = [
  {
    category: CATEGORY.AUTH_INVALID,
    test: (s) => /\b(invalid[ _-]?(api[ _-]?key|token|auth))\b/.test(s)
      || /\bunauthorized\b/.test(s)
      || /\bauthentication_error\b/.test(s)
      || /\bincorrect api key\b/.test(s)
      || /\bno auth credentials\b/.test(s)
      || /\bmissing api key\b/.test(s)
      || /\bexpired token\b/.test(s),
  },
  {
    category: CATEGORY.FORBIDDEN,
    test: (s) => /\bforbidden\b/.test(s) || /\bpermission[ _-]?denied\b/.test(s)
      || /\bnot (?:enabled|allowed) for (?:your|this)\b/.test(s),
  },
  {
    category: CATEGORY.QUOTA_EXHAUSTED,
    test: (s) => /\bquota\b/.test(s) || /\binsufficient (?:credits?|quota|balance)\b/.test(s)
      || /\bexceeded your current quota\b/.test(s) || /\bcredits? exhausted\b/.test(s)
      || /\bbilling (?:required|hard limit)\b/.test(s)
      || /\bpayment required\b/.test(s) || /\b402\b/.test(s),
  },
  {
    category: CATEGORY.RATE_LIMITED,
    test: (s) => /\brate[ _-]?limit/.test(s) || /\btoo many requests\b/.test(s)
      || /\brequests per (?:minute|hour|day)\b/.test(s) || /\b429\b/.test(s)
      || /\bslow down\b/.test(s),
  },
  {
    category: CATEGORY.MODEL_NOT_FOUND,
    test: (s) => /\bmodel (?:not found|does not exist|not available|unavailable|deprecated)\b/.test(s)
      || /\bno such model\b/.test(s)
      || /\bunknown model\b/.test(s)
      || /\bnot a valid model\b/.test(s)
      || /\bis not available\b/.test(s)
      || /\b404\b/.test(s),
  },
  {
    category: CATEGORY.MODEL_CONTENT_FILTER,
    test: (s) => /\bcontent (?:filter|policy)\b/.test(s) || /\bsafety system\b/.test(s)
      || /\bblocked by (?:the )?(?:content )?(?:safety|moderation)\b/.test(s),
  },
  {
    category: CATEGORY.MODEL_UNSUPPORTED_PARAM,
    test: (s) => /\bunsupported (?:parameter|parameter:|value for|feature)\b/.test(s)
      || /\bdoes not support\b/.test(s)
      || /\bnot supported (?:for|in|by)\b/.test(s)
      || /\btool use is not\b/.test(s)
      || /\btools? (?:are|is) not (?:supported|supported|allowed)\b/.test(s),
  },
  {
    category: CATEGORY.UPSTREAM_OVERLOADED,
    test: (s) => /\boverloaded\b/.test(s) || /\b529\b/.test(s)
      || /\bcapacity\b/.test(s) || /\bserver is busy\b/.test(s) || /\btry again later\b/.test(s),
  },
  {
    category: CATEGORY.PROVIDER_OUTAGE,
    test: (s) => /\binternal server error\b/.test(s) || /\bbad gateway\b/.test(s)
      || /\bservice unavailable\b/.test(s) || /\bgateway time-?out\b/.test(s)
      || /\bupstream error\b/.test(s) || /\b(?:50[0-8])\b/.test(s)
      || /\bregion is currently unavailable\b/.test(s),
  },
  {
    // Bare 5xx after the specific ones above.
    category: CATEGORY.PROVIDER_OUTAGE,
    test: (s, status) => typeof status === "number" && status >= 500 && status <= 599,
  },
  {
    category: CATEGORY.MODEL_NO_OUTPUT,
    test: (s) => /\bno completion choices\b/.test(s) || /\bempty (?:response|completion)\b/.test(s)
      || /\breturned no (?:completion|text|content|output|embedding)\b/.test(s)
      || /\bzero tokens\b/.test(s),
  },
  {
    category: CATEGORY.TIMEOUT,
    test: (s) => /\btimed? ?out\b/.test(s) || /\betimedout\b/.test(s) || /\babort(?:ed)?\b/.test(s),
  },
  {
    category: CATEGORY.NETWORK,
    test: (s) => /\beconnrefused\b/.test(s) || /\beconnreset\b/.test(s)
      || /\benotfound\b/.test(s) || /\benot_found\b/.test(s) || /\bsocket hang up\b/.test(s)
      || /\bfetch failed\b/.test(s) || /\bnetwork error\b/.test(s)
      || /\bgetaddrinfo\b/.test(s) || /\bepipe\b/.test(s) || /\bssl\b/.test(s)
      || /\bcertificate\b/.test(s) || /\bdns\b/.test(s),
  },
];

/**
 * Classify a probe failure.
 * @param {object} input
 * @param {number} [input.status]  HTTP status
 * @param {string} [input.message] error message / provider error body
 * @param {string} [input.check]   which probe failed
 * @returns {{ category: string, scope: string, modelScoped: boolean }}
 */
export function classifyError({ status, message, check } = {}) {
  const s = text(message);
  let category = CATEGORY.UNKNOWN;

  // HTTP status alone is a strong hint even with no body — several providers
  // return an empty body on 401/429/5xx.
  if (typeof status === "number") {
    if (status === 401) category = CATEGORY.AUTH_INVALID;
    else if (status === 403) category = CATEGORY.FORBIDDEN;
    else if (status === 402) category = CATEGORY.QUOTA_EXHAUSTED;
    else if (status === 429) category = CATEGORY.RATE_LIMITED;
    else if (status === 404) category = CATEGORY.MODEL_NOT_FOUND;
  }

  if (category === CATEGORY.UNKNOWN) {
    for (const rule of RULES) {
      if (rule.test(s, status)) {
        category = rule.category;
        break;
      }
    }
  }

  // An empty completion is a model-level finding regardless of HTTP 200, but a
  // *tool* probe that returns nothing is often a refusal — treat an unexplained
  // empty tool response as unknown rather than failing the model.
  if (category === CATEGORY.UNKNOWN && check === "completion" && /\bno completion\b/.test(s)) {
    category = CATEGORY.MODEL_NO_OUTPUT;
  }

  const scope = scopeForCategory(category);
  return { category, scope, modelScoped: scope === SCOPE.MODEL };
}

/**
 * Why a health verdict may not be upgraded to FAIL, in words the dashboard can
 * show next to the model.
 */
export function explainNonModelScope(scope, category) {
  switch (scope) {
    case SCOPE.ACCOUNT:
      return category === CATEGORY.RATE_LIMITED
        ? "Rate limited — the model's health was not changed."
        : category === CATEGORY.QUOTA_EXHAUSTED
          ? "Account quota exhausted — the model's health was not changed."
          : "Credential or account problem — the model's health was not changed.";
    case SCOPE.PROVIDER:
      return category === CATEGORY.TIMEOUT || category === CATEGORY.NETWORK
        ? "Network/timeout reaching the provider — the model's health was not changed."
        : "Provider unavailable — the model's health was not changed.";
    default:
      return "Inconclusive — the model's health was not changed.";
  }
}
