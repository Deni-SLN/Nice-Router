// Redaction for anything that gets persisted or returned to the dashboard.
//
// Provider error bodies routinely echo the credential that was sent back at us
// ("Incorrect API key provided: sk-or-v1-abc…", "Bearer eyJ…"), and a gateway
// error can quote the whole request. Storing that verbatim would put live
// credentials in the SQLite file, in backups, and in the diagnostics page that
// renders it. Everything persisted goes through here first.
//
// Each rule declares what to do with its capture group explicitly. Getting this
// wrong in either direction is bad: keeping the group leaks the secret, while
// dropping a label like "bearer" makes the diagnosis unreadable.

const RULES = [
  // Authorization: Bearer <token> — keep the label, drop the value.
  { re: /\b(bearer)\s+[A-Za-z0-9._~+/=-]{8,}/gi, keepGroup: true },
  // Raw provider key shapes — the whole match IS the secret.
  { re: /\bsk-[A-Za-z0-9_-]{6,}/g, keepGroup: false },
  { re: /\bgh[pousr]_[A-Za-z0-9]{16,}/g, keepGroup: false },
  { re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/g, keepGroup: false },
  { re: /\bAIza[0-9A-Za-z_-]{20,}/g, keepGroup: false },
  // JWTs.
  { re: /\bey[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}/g, keepGroup: false },
  // Header / JSON pairs — keep the key so the field stays identifiable.
  { re: /("?x-api-key"?\s*[:=]\s*"?)([^"\s,}]{6,})/gi, keepGroup: 2 },
  { re: /("?api[_-]?key"?\s*[:=]\s*"?)([^"\s,}]{6,})/gi, keepGroup: 2 },
  { re: /("?authorization"?\s*[:=]\s*"?)([^"\s,}]{6,})/gi, keepGroup: 2 },
  { re: /("?access[_-]?token"?\s*[:=]\s*"?)([^"\s,}]{8,})/gi, keepGroup: 2 },
  { re: /("?refresh[_-]?token"?\s*[:=]\s*"?)([^"\s,}]{8,})/gi, keepGroup: 2 },
  { re: /("?client[_-]?secret"?\s*[:=]\s*"?)([^"\s,}]{8,})/gi, keepGroup: 2 },
];

export const REDACTED = "[redacted]";

/** Replace credential-shaped substrings. Safe to run more than once. */
export function redactSecrets(input) {
  if (input === null || input === undefined) return input;
  let text = typeof input === "string" ? input : String(input);
  for (const { re, keepGroup } of RULES) {
    text = keepGroup === false
      ? text.replace(re, REDACTED)
      // keepGroup is the 1-based index of the group that is the LABEL; every
      // other group (the value) is dropped.
      : text.replace(re, (...args) => {
        const groups = args.slice(0, -2);
        const label = keepGroup === true ? groups[0] : groups[keepGroup - 1];
        return label ? `${label} ${REDACTED}` : REDACTED;
      });
  }
  return text;
}

/** Redact, then cap the length, so nothing unbounded is ever stored. */
export function redactAndTruncate(input, max = 300) {
  if (input === null || input === undefined) return input;
  return redactSecrets(String(input)).slice(0, max);
}

/** Strip every credential field from a connection before it reaches a log. */
export function redactConnection(connection) {
  if (!connection || typeof connection !== "object") return connection;
  const out = { ...connection };
  for (const key of ["apiKey", "accessToken", "refreshToken", "idToken", "clientSecret", "password"]) {
    if (out[key]) out[key] = REDACTED;
  }
  if (out.providerSpecificData && typeof out.providerSpecificData === "object") {
    const psd = { ...out.providerSpecificData };
    for (const key of Object.keys(psd)) {
      if (/token|key|secret|password|cookie/i.test(key)) psd[key] = REDACTED;
    }
    out.providerSpecificData = psd;
  }
  return out;
}
