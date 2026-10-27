// Phase 3: error classification.
// The contract under test: only a MODEL-scoped failure may ever move a model
// to FAIL. A dead API key, an exhausted quota, a 429 or a provider outage must
// leave every model's health untouched.
import { describe, it, expect } from "vitest";
import {
  classifyError, isModelScoped, scopeForCategory, CATEGORY, SCOPE, explainNonModelScope,
} from "@/lib/intelligence/classify.js";

describe("model-scoped errors", () => {
  it("classifies a missing model as a model failure", () => {
    const r = classifyError({ status: 404, message: "No endpoints found for meta/ghost:free" });
    expect(r.category).toBe(CATEGORY.MODEL_NOT_FOUND);
    expect(r.scope).toBe(SCOPE.MODEL);
    expect(isModelScoped(r.category)).toBe(true);
  });

  it("classifies an unsupported parameter as a model failure", () => {
    const r = classifyError({ status: 400, message: "This model does not support tools", check: "tool_calling" });
    expect(isModelScoped(r.category)).toBe(true);
  });

  it("classifies an empty completion as a model failure", () => {
    const r = classifyError({ status: 200, message: "Provider returned no completion choices for this model", check: "completion" });
    expect(r.category).toBe(CATEGORY.MODEL_NO_OUTPUT);
    expect(r.scope).toBe(SCOPE.MODEL);
  });

  it("classifies a content-filter refusal as a model failure", () => {
    const r = classifyError({ status: 400, message: "Blocked by content policy" });
    expect(r.category).toBe(CATEGORY.MODEL_CONTENT_FILTER);
    expect(isModelScoped(r.category)).toBe(true);
  });
});

describe("account-scoped errors never fail a model", () => {
  it("401 is an auth problem, not a model problem", () => {
    const r = classifyError({ status: 401, message: "Unauthorized" });
    expect(r.category).toBe(CATEGORY.AUTH_INVALID);
    expect(r.scope).toBe(SCOPE.ACCOUNT);
    expect(isModelScoped(r.category)).toBe(false);
  });

  it("an invalid API key in the body is auth-scoped even behind a 500", () => {
    const r = classifyError({ status: 500, message: "{\"error\":\"Invalid API key provided\"}" });
    expect(r.category).toBe(CATEGORY.AUTH_INVALID);
    expect(isModelScoped(r.category)).toBe(false);
  });

  it("403 is forbidden, not a model failure", () => {
    const r = classifyError({ status: 403, message: "Forbidden" });
    expect(r.scope).toBe(SCOPE.ACCOUNT);
    expect(isModelScoped(r.category)).toBe(false);
  });

  it("402 / exhausted credits is quota, not a model failure", () => {
    expect(classifyError({ status: 402, message: "Payment required" }).scope).toBe(SCOPE.ACCOUNT);
    expect(classifyError({ message: "Insufficient credits" }).category).toBe(CATEGORY.QUOTA_EXHAUSTED);
  });

  it("429 is rate limiting, not a model failure", () => {
    const r = classifyError({ status: 429, message: "Rate limit exceeded" });
    expect(r.category).toBe(CATEGORY.RATE_LIMITED);
    expect(isModelScoped(r.category)).toBe(false);
  });
});

describe("provider-scoped errors never fail a model", () => {
  it("503 is an outage", () => {
    const r = classifyError({ status: 503, message: "Service Unavailable" });
    expect(r.scope).toBe(SCOPE.PROVIDER);
    expect(isModelScoped(r.category)).toBe(false);
  });

  it("500 is an outage", () => {
    expect(classifyError({ status: 500, message: "" }).scope).toBe(SCOPE.PROVIDER);
  });

  it("529 is overload, not a dead model", () => {
    const r = classifyError({ status: 529, message: "Overloaded" });
    expect(r.category).toBe(CATEGORY.UPSTREAM_OVERLOADED);
    expect(isModelScoped(r.category)).toBe(false);
  });

  it("timeouts and DNS failures are provider-scoped", () => {
    expect(classifyError({ message: "The operation was aborted (timed out)" }).category).toBe(CATEGORY.TIMEOUT);
    expect(classifyError({ message: "fetch failed: getaddrinfo ENOTFOUND" }).category).toBe(CATEGORY.NETWORK);
  });
});

describe("classification helpers", () => {
  it("an unrecognised failure is UNKNOWN scope, which is not model-scoped", () => {
    const r = classifyError({ status: 418, message: "something odd happened" });
    expect(r.scope).toBe(SCOPE.UNKNOWN);
    expect(isModelScoped(r.category)).toBe(false);
  });

  it("scopeForCategory partitions every category into exactly one scope", () => {
    const account = Object.values(CATEGORY).filter((c) => scopeForCategory(c) === SCOPE.ACCOUNT);
    const provider = Object.values(CATEGORY).filter((c) => scopeForCategory(c) === SCOPE.PROVIDER);
    const model = Object.values(CATEGORY).filter((c) => scopeForCategory(c) === SCOPE.MODEL);
    const unknown = Object.values(CATEGORY).filter((c) => scopeForCategory(c) === SCOPE.UNKNOWN);
    expect(account.length + provider.length + model.length + unknown.length).toBe(Object.values(CATEGORY).length);
    // Exactly the unclassified bucket is UNKNOWN-scope.
    expect(unknown).toEqual([CATEGORY.UNKNOWN]);
    // A model-scoped category is the only thing that may fail a model.
    expect(model.every((c) => isModelScoped(c))).toBe(true);
    expect([...account, ...provider].every((c) => !isModelScoped(c))).toBe(true);
  });

  it("explains every non-model scope in words the dashboard can show", () => {
    expect(explainNonModelScope(SCOPE.ACCOUNT, CATEGORY.AUTH_INVALID)).toMatch(/Credential or account/i);
    expect(explainNonModelScope(SCOPE.PROVIDER, CATEGORY.PROVIDER_OUTAGE)).toMatch(/Provider unavailable/i);
    expect(explainNonModelScope(SCOPE.UNKNOWN, CATEGORY.UNKNOWN)).toMatch(/Inconclusive/i);
    // Every explanation must state that health was not touched.
    for (const scope of [SCOPE.ACCOUNT, SCOPE.PROVIDER, SCOPE.UNKNOWN]) {
      expect(explainNonModelScope(scope, CATEGORY.UNKNOWN)).toMatch(/was not changed/i);
    }
  });

  it("is case-insensitive and tolerant of JSON bodies", () => {
    expect(classifyError({ message: '{"error":{"message":"INVALID API KEY"}}' }).scope).toBe(SCOPE.ACCOUNT);
    expect(classifyError({ message: "MODEL NOT FOUND" }).category).toBe(CATEGORY.MODEL_NOT_FOUND);
  });
});
