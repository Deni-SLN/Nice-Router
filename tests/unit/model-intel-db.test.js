// Phase 8 + 9: schema migration safety, probe parsing, cost controls and
// security guarantees (no secrets in stored or returned state).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { HEALTH } from "@/lib/db/repos/modelIntelRepo.js";

let tempDir;
const originalDataDir = process.env.DATA_DIR;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "9router-mi2-"));
  process.env.DATA_DIR = tempDir;
  delete global._dbAdapter;
  vi.resetModules();
});

afterEach(() => {
  try { global._dbAdapter?.instance?.close?.(); } catch {}
  delete global._dbAdapter;
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
  if (originalDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = originalDataDir;
});

describe("database migration safety", () => {
  it("a fresh DB gets the model-intelligence tables and the new schema version", async () => {
    const { getAdapter } = await import("@/lib/db/driver.js");
    const { latestVersion } = await import("@/lib/db/migrations/index.js");
    const { SCHEMA_VERSION } = await import("@/lib/db/schema.js");
    const db = await getAdapter();

    const tables = db.all(`SELECT name FROM sqlite_master WHERE type='table'`).map((t) => t.name);
    expect(tables).toEqual(expect.arrayContaining(["modelIntel", "modelIntelEvents", "modelIntelSyncs"]));

    const row = db.get(`SELECT value FROM _meta WHERE key='schemaVersion'`);
    expect(Number.parseInt(row.value, 10)).toBe(latestVersion());
    expect(latestVersion()).toBeGreaterThanOrEqual(2);
    // The pre-change backup gate is keyed off SCHEMA_VERSION.
    expect(SCHEMA_VERSION).toBeGreaterThanOrEqual(3);
  });

  it("migration 002 is additive — no DROP, RENAME or ALTER on existing tables", async () => {
    const { default: migration } = await import("@/lib/db/migrations/002-model-intel.js");
    const db = await (await import("@/lib/db/driver.js")).getAdapter();
    const realExec = db.exec.bind(db);
    const statements = [];
    db.exec = (sql) => { statements.push(sql); return realExec(sql); };
    migration.up(db);
    db.exec = realExec;

    const sql = statements.join("\n").toUpperCase();
    expect(statements.length).toBeGreaterThan(0);
    expect(sql).not.toMatch(/\bDROP\b/);
    expect(sql).not.toMatch(/\bRENAME\b/);
    expect(sql).not.toMatch(/\bALTER\s+TABLE\b/);
    for (const s of statements) expect(s).toMatch(/CREATE (TABLE|INDEX) IF NOT EXISTS/);
  });

  it("pre-existing user configuration survives the migration", async () => {
    // Write rows the way the rest of the app does.
    const { createProviderConnection } = await import("@/lib/db/repos/connectionsRepo.js");
    const { createCombo } = await import("@/lib/db/repos/combosRepo.js");
    const { setModelAlias } = await import("@/lib/db/repos/aliasRepo.js");
    const { updateSettings } = await import("@/lib/db/repos/settingsRepo.js");

    await createProviderConnection({ provider: "openrouter", authType: "apikey", name: "or-key", apiKey: "sk-secret-value" });
    await createCombo({ name: "my-combo", models: ["openrouter/a", "anthropic/b"] });
    await setModelAlias("fast", "openrouter/a:free");
    await updateSettings({ comboStrategy: "failover" });

    // Re-open the database from scratch, exactly as a process restart would:
    // close the handle, drop the driver singleton, and drop the module cache so
    // the repos below are freshly bound to the new adapter.
    try { global._dbAdapter?.instance?.close?.(); } catch {}
    delete global._dbAdapter;
    vi.resetModules();

    const { getProviderConnections } = await import("@/lib/db/repos/connectionsRepo.js");
    const { getCombos } = await import("@/lib/db/repos/combosRepo.js");
    const { getModelAliases } = await import("@/lib/db/repos/aliasRepo.js");
    const { getSettings } = await import("@/lib/db/repos/settingsRepo.js");

    const conns = await getProviderConnections();
    expect(conns).toHaveLength(1);
    expect(conns[0].apiKey).toBe("sk-secret-value");
    expect((await getCombos()).map((c) => c.name)).toEqual(["my-combo"]);
    expect((await getModelAliases()).fast).toBe("openrouter/a:free");
    expect((await getSettings()).comboStrategy).toBe("failover");
  });

  it("an intelligence row and a provider connection coexist without interference", async () => {
    const { createProviderConnection, getProviderConnections } = await import("@/lib/db/repos/connectionsRepo.js");
    const repo = await import("@/lib/db/repos/modelIntelRepo.js");
    await createProviderConnection({ provider: "openrouter", authType: "apikey", name: "k", apiKey: "sk-x" });
    await repo.upsertDiscoveredModel({ provider: "openrouter", model: "a:free", name: "A" });
    await repo.updateModelIntelState("openrouter", "a:free", { health: HEALTH.FAIL, quarantined: true });
    expect(await getProviderConnections()).toHaveLength(1);
    expect((await repo.getModelIntel("openrouter", "a:free")).quarantined).toBe(true);
  });

  it("a legacy settings row with no intelligence key still yields sane defaults", async () => {
    const { getIntelConfig } = await import("@/lib/intelligence/config.js");
    const { DEFAULT_INTELLIGENCE_CONFIG } = await import("@/lib/intelligence/config.js");
    const config = await getIntelConfig();
    expect(config.failureThreshold).toBe(DEFAULT_INTELLIGENCE_CONFIG.failureThreshold);
    expect(config.recoveryPasses).toBeGreaterThanOrEqual(1);
    expect(config.providers).toEqual(expect.objectContaining({ openrouter: true }));
  });
});

describe("config validation", () => {
  it("clamps numbers and drops unknown keys", async () => {
    const { sanitizeIntelConfig } = await import("@/lib/intelligence/config.js");
    const out = sanitizeIntelConfig({
      testConcurrency: 9999,          // above the cap
      failureThreshold: -5,           // below the floor
      testTimeoutMs: "abc",           // not a number
      allowPaidTests: "true",         // coerced
      __proto__: { polluted: true },   // prototype pollution attempt
      totallyUnknown: 1,
    });
    expect(out.testConcurrency).toBe(16);
    expect(out.failureThreshold).toBe(1);
    expect(out.testTimeoutMs).toBeUndefined();
    expect(out.allowPaidTests).toBe(true);
    expect(out.totallyUnknown).toBeUndefined();
    expect(out.polluted).toBeUndefined();
    expect({}.polluted).toBeUndefined();
  });

  it("persists only whitelisted keys", async () => {
    const { updateIntelConfig, getIntelConfig } = await import("@/lib/intelligence/config.js");
    const config = await updateIntelConfig({ testConcurrency: 3, evil: "x", password: "leak" });
    expect(config.testConcurrency).toBe(3);
    expect(config.evil).toBeUndefined();
    expect(config.password).toBeUndefined();
  });

  it("override values are whitelisted", async () => {
    const { sanitizeOverride } = await import("@/lib/intelligence/override.js");
    expect(sanitizeOverride("force_pass")).toBe("FORCE_PASS");
    expect(sanitizeOverride(null)).toBeNull();
    expect(sanitizeOverride("")).toBeNull();
    expect(sanitizeOverride("DROP TABLE")).toBeNull();
  });
});

describe("probe helpers", () => {
  it("extracts assistant text from string and array content", async () => {
    const { extractAssistantText, extractReasoningText } = await import("@/lib/intelligence/probe.js");
    expect(extractAssistantText({ choices: [{ message: { content: "ok" } }] })).toBe("ok");
    expect(extractAssistantText({ choices: [{ message: { content: [{ type: "text", text: "a" }, { type: "text", text: "b" }] } }] })).toBe("ab");
    expect(extractAssistantText({})).toBe("");
    expect(extractReasoningText({ choices: [{ message: { reasoning: "thinking..." } }] })).toBe("thinking...");
  });

  it("parses SSE content deltas and ignores [DONE] and partial frames", async () => {
    const { parseSseDeltas } = await import("@/lib/intelligence/probe.js");
    const body = [
      'data: {"choices":[{"delta":{"content":"He"}}]}',
      'data: {"choices":[{"delta":{"content":"llo"}}]}',
      "",
      "data: [DONE]",
      'data: {"choices":[{"delta":{"content":"wor',
    ].join("\n");
    expect(parseSseDeltas(body)).toEqual(["He", "llo"]);
    expect(parseSseDeltas("")).toEqual([]);
    expect(parseSseDeltas("not sse at all")).toEqual([]);
  });
});

describe("cost controls", () => {
  const CONFIG = { allowPaidTests: false, maxTestContextWindow: 400000, retestAfterMs: 0 };

  async function row(over) {
    const repo = await import("@/lib/db/repos/modelIntelRepo.js");
    await repo.upsertDiscoveredModel({
      provider: "openrouter", model: "x", name: "X", meta: over.meta || {},
    });
    const base = await repo.getModelIntel("openrouter", "x");
    if (over.state) await repo.updateModelIntelState("openrouter", "x", over.state);
    return (await repo.getModelIntel("openrouter", "x")) || base;
  }

  it("a paid model is never probed while paid tests are disabled", async () => {
    const { canTestRow } = await import("@/lib/intelligence/runner.js");
    const paid = await row({ meta: { pricing: { prompt: "0.001", completion: "0.002" } } });
    const verdict = canTestRow(paid, CONFIG, { force: true });
    expect(verdict.allowed).toBe(false);
    expect(verdict.reason).toMatch(/paid/i);
  });

  it("an unknown-price model is skipped too — no surprises", async () => {
    const { canTestRow } = await import("@/lib/intelligence/runner.js");
    const unknown = await row({ meta: {} });
    expect(canTestRow(unknown, CONFIG, { force: true }).allowed).toBe(false);
  });

  it("a confirmed-free model is probed", async () => {
    const { canTestRow } = await import("@/lib/intelligence/runner.js");
    const free = await row({ meta: { pricing: { prompt: "0", completion: "0" } } });
    expect(canTestRow(free, CONFIG, { force: true }).allowed).toBe(true);
  });

  it("paid models become probeable once the setting is enabled", async () => {
    const { canTestRow } = await import("@/lib/intelligence/runner.js");
    const paid = await row({ meta: { pricing: { prompt: "0.001", completion: "0.002" } } });
    expect(canTestRow(paid, { ...CONFIG, allowPaidTests: true }, { force: true }).allowed).toBe(true);
  });

  it("a model inside the free gate cannot be probed by force when paid tests are off", async () => {
    // force bypasses the cooldown, not the spending gate.
    const { canTestRow } = await import("@/lib/intelligence/runner.js");
    const paid = await row({ meta: { pricing: { prompt: "1", completion: "1" } }, state: { quarantined: true } });
    expect(canTestRow(paid, CONFIG, { force: true }).allowed).toBe(false);
  });

  it("a manually failed model is never retested automatically", async () => {
    const { canTestRow } = await import("@/lib/intelligence/runner.js");
    const blocked = await row({ state: { manualOverride: "FORCE_FAIL", quarantined: true } });
    expect(canTestRow(blocked, { ...CONFIG, allowPaidTests: true }, { force: true }).allowed).toBe(false);
  });
});

describe("security", () => {
  it("no API key or token is ever written into an intelligence row", async () => {
    const repo = await import("@/lib/db/repos/modelIntelRepo.js");
    await repo.upsertDiscoveredModel({
      provider: "openrouter", model: "secret-test", name: "S",
      meta: { pricing: { prompt: "0", completion: "0" } },
    });
    // Anything the caller might try to smuggle in must not be persisted verbatim.
    await repo.updateModelIntelState("openrouter", "secret-test", {
      health: "FAIL",
      lastError: "HTTP 401: Incorrect API key provided: sk-or-v1-REALKEY123456",
      healthReason: "auth_invalid",
    });
    await repo.addModelIntelEvent({
      modelIntelId: "openrouter/secret-test", provider: "openrouter", model: "secret-test",
      message: "Authorization: Bearer sk-or-v1-REALKEY123456",
    });

    const row = await repo.getModelIntel("openrouter", "secret-test");
    const serialized = JSON.stringify(row);
    // The row stores the diagnosis, never a credential.
    expect(serialized).not.toMatch(/sk-or-v1-REALKEY123456/);
    expect(row.healthReason).toBe("auth_invalid");

    const [event] = await repo.getModelHistory("openrouter/secret-test");
    expect(JSON.stringify(event)).not.toMatch(/sk-or-v1-REALKEY123456/);
  });

  it("sync error records are provider-scoped strings, not connection objects", async () => {
    const repo = await import("@/lib/db/repos/modelIntelRepo.js");
    await repo.recordSyncRun({ status: "error", errors: ["openrouter: HTTP 401 Unauthorized"] });
    const last = await repo.getLastSyncRun();
    expect(last.errors).toEqual(["openrouter: HTTP 401 Unauthorized"]);
    expect(JSON.stringify(last)).not.toMatch(/apiKey|accessToken|refreshToken/i);
  });

  it("the compatibility adapter never fetches a caller-supplied URL", async () => {
    // The adapter's URL comes from the registry at module load; there is no code
    // path that accepts one from a request body or query string.
    const src = fs.readFileSync(
      path.join(process.cwd(), "..", "src", "lib", "intelligence", "adapters", "openaiCompatible.js"),
      "utf8"
    );
    expect(src).not.toMatch(/request\.json/);
    expect(src).not.toMatch(/searchParams/);
    // The URL is only ever read off the adapter instance built from the registry.
    expect(src).toMatch(/createCompatibleAdapter/);
    expect(src).toMatch(/this\.catalogUrl\(\)/);

    const index = fs.readFileSync(
      path.join(process.cwd(), "..", "src", "lib", "intelligence", "adapters", "index.js"),
      "utf8"
    );
    // Only registry-declared, https-only URLs are ever registered.
    expect(index).toMatch(/modelsFetcher\?\.url/);
    expect(index).toContain("https:");
  });

  it("redacts credentials echoed back by a provider", async () => {
    const { redactSecrets, redactConnection, REDACTED } = await import("@/lib/intelligence/redact.js");

    expect(redactSecrets("Incorrect API key provided: sk-or-v1-abc123def456")).not.toMatch(/sk-or-v1-abc/);
    expect(redactSecrets("Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.payloadbody.signature")).not.toMatch(/eyJhbGciOiJIUzI1NiJ9/);
    expect(redactSecrets('{"api_key":"super-secret-value"}')).not.toMatch(/super-secret-value/);
    expect(redactSecrets('{"x-api-key":"super-secret-value"}')).not.toMatch(/super-secret-value/);
    expect(redactSecrets("no secrets here")).toBe("no secrets here");
    // The diagnosis survives the value being blanked.
    expect(redactSecrets('{"x-api-key":"abc123"}')).toContain("x-api-key");

    const conn = redactConnection({
      provider: "openrouter", apiKey: "sk-1", accessToken: "at", refreshToken: "rt",
      providerSpecificData: { copilotToken: "ct", someFlag: true },
    });
    expect(conn.apiKey).toBe(REDACTED);
    expect(conn.accessToken).toBe(REDACTED);
    expect(conn.refreshToken).toBe(REDACTED);
    expect(conn.providerSpecificData.copilotToken).toBe(REDACTED);
    expect(conn.providerSpecificData.someFlag).toBe(true);
  });
});