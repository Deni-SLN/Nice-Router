import { getAdapter } from "../driver.js";
import { parseJson, stringifyJson } from "../helpers/jsonCol.js";
import { redactAndTruncate } from "@/lib/intelligence/redact.js";

// Health states. `health` is a column value, so the enum lives next to the
// schema access and is re-exported by the intelligence layer.
export const HEALTH = Object.freeze({
  PASS: "PASS",
  DEGRADED: "DEGRADED",
  FAIL: "FAIL",
  UNKNOWN: "UNKNOWN",
});
export const HEALTH_VALUES = Object.freeze(Object.values(HEALTH));

// Manual override wins over every automatic transition. `null` clears it.
export const OVERRIDE = Object.freeze({
  FORCE_PASS: "FORCE_PASS",
  FORCE_FAIL: "FORCE_FAIL",
  FORCE_DEGRADED: "FORCE_DEGRADED",
});

// Keep the probe trail bounded — enough for the diagnostics page and for
// spotting flapping, without letting an hourly job grow the DB forever.
const HISTORY_LIMIT = 200;
const SYNC_LOG_LIMIT = 50;

export function modelIntelId(provider, model) {
  return `${provider}/${model}`;
}

function rowToIntel(row) {
  if (!row) return null;
  return {
    id: row.id,
    provider: row.provider,
    model: row.model,
    name: row.name || null,
    kind: row.kind || "llm",
    source: row.source || null,
    discovered: row.discovered === 1,
    presentInCatalog: row.presentInCatalog !== 0,
    health: row.health || HEALTH.UNKNOWN,
    healthReason: row.healthReason ? redactAndTruncate(row.healthReason, 300) : null,
    errorCategory: row.errorCategory || null,
    errorScope: row.errorScope || null,
    consecutiveFailures: row.consecutiveFailures || 0,
    consecutivePasses: row.consecutivePasses || 0,
    quarantineCount: row.quarantineCount || 0,
    quarantined: row.quarantined === 1,
    manualOverride: row.manualOverride || null,
    lastTestedAt: row.lastTestedAt || null,
    lastSyncAt: row.lastSyncAt || null,
    quarantinedUntil: row.quarantinedUntil || null,
    latencyMs: row.latencyMs ?? null,
    avgLatencyMs: row.avgLatencyMs ?? null,
    lastError: row.lastError ? redactAndTruncate(row.lastError, 300) : null,
    retryCount: row.retryCount || 0,
    testedCapabilities: parseJson(row.testedCapabilities, null),
    data: parseJson(row.data, {}) || {},
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const SELECT_COLS = `id, provider, model, name, kind, source, discovered, presentInCatalog,
  health, healthReason, errorCategory, errorScope, consecutiveFailures, consecutivePasses,
  quarantineCount, quarantined, manualOverride, lastTestedAt, lastSyncAt, quarantinedUntil,
  latencyMs, avgLatencyMs, lastError, retryCount, testedCapabilities, data, createdAt, updatedAt`;

export async function getModelIntelById(id) {
  const db = await getAdapter();
  return rowToIntel(db.get(`SELECT ${SELECT_COLS} FROM modelIntel WHERE id = ?`, [id]));
}

export async function getModelIntel(provider, model) {
  return getModelIntelById(modelIntelId(provider, model));
}

/**
 * @param {object} filter - { provider?, health?, quarantined?, includeMissing? }
 */
export async function listModelIntel(filter = {}) {
  const db = await getAdapter();
  const where = [];
  const params = [];
  if (filter.provider) {
    where.push("provider = ?");
    params.push(filter.provider);
  }
  if (filter.health) {
    const list = Array.isArray(filter.health) ? filter.health : [filter.health];
    where.push(`health IN (${list.map(() => "?").join(",")})`);
    params.push(...list);
  }
  if (filter.quarantined === true) where.push("quarantined = 1");
  if (filter.quarantined === false) where.push("quarantined = 0");
  if (!filter.includeMissing) where.push("presentInCatalog = 1");
  const sql = `SELECT ${SELECT_COLS} FROM modelIntel${where.length ? ` WHERE ${where.join(" AND ")}` : ""} ORDER BY provider, model`;
  return db.all(sql, params).map(rowToIntel);
}

export async function getAllModelIntel(filter) {
  return listModelIntel({ ...filter, includeMissing: true });
}

// Hot path for /v1/models: one row per eligible model. Cached for a few seconds
// so a burst of catalog requests does not turn into a burst of queries.
const MAP_TTL_MS = 3000;
let mapCache = { value: null, expiresAt: 0 };

export function invalidateIntelCache() {
  mapCache = { value: null, expiresAt: 0 };
}

export async function getIntelMap() {
  const now = Date.now();
  if (mapCache.value && mapCache.expiresAt > now) return mapCache.value;
  const rows = await listModelIntel();
  const map = new Map();
  for (const row of rows) map.set(row.id, row);
  mapCache = { value: map, expiresAt: now + MAP_TTL_MS };
  return map;
}

function upsertRow(db, id, provider, model, patch) {
  const now = new Date().toISOString();
  const existing = db.get(`SELECT ${SELECT_COLS} FROM modelIntel WHERE id = ?`, [id]);
  const merged = {
    ...(existing ? rowToIntel(existing) : null),
    ...patch,
    provider,
    model,
  };
  db.run(
    `INSERT INTO modelIntel (id, provider, model, name, kind, source, discovered, presentInCatalog,
        health, healthReason, errorCategory, errorScope, consecutiveFailures, consecutivePasses,
        quarantineCount, quarantined, manualOverride, lastTestedAt, lastSyncAt, quarantinedUntil,
        latencyMs, avgLatencyMs, lastError, retryCount, testedCapabilities, data, createdAt, updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
        name=excluded.name, kind=excluded.kind, source=excluded.source, discovered=excluded.discovered,
        presentInCatalog=excluded.presentInCatalog, health=excluded.health, healthReason=excluded.healthReason,
        errorCategory=excluded.errorCategory, errorScope=excluded.errorScope,
        consecutiveFailures=excluded.consecutiveFailures, consecutivePasses=excluded.consecutivePasses,
        quarantineCount=excluded.quarantineCount, quarantined=excluded.quarantined,
        manualOverride=excluded.manualOverride, lastTestedAt=excluded.lastTestedAt,
        lastSyncAt=excluded.lastSyncAt, quarantinedUntil=excluded.quarantinedUntil,
        latencyMs=excluded.latencyMs, avgLatencyMs=excluded.avgLatencyMs, lastError=excluded.lastError,
        retryCount=excluded.retryCount, testedCapabilities=excluded.testedCapabilities,
        data=excluded.data, updatedAt=excluded.updatedAt`,
    [
      id, provider, model, merged.name || null, merged.kind || "llm", merged.source || null,
      merged.discovered ? 1 : 0, merged.presentInCatalog === false ? 0 : 1,
      merged.health || HEALTH.UNKNOWN,
      // Redacted at write time, not just on read: a credential echoed by a
      // provider must never reach the SQLite file or its backups.
      merged.healthReason ? redactAndTruncate(merged.healthReason, 300) : null,
      merged.errorCategory || null,
      merged.errorScope || null, merged.consecutiveFailures || 0, merged.consecutivePasses || 0,
      merged.quarantineCount || 0, merged.quarantined ? 1 : 0, merged.manualOverride || null,
      merged.lastTestedAt || null, merged.lastSyncAt || null, merged.quarantinedUntil || null,
      merged.latencyMs ?? null, merged.avgLatencyMs ?? null,
      merged.lastError ? redactAndTruncate(merged.lastError, 300) : null,
      merged.retryCount || 0, stringifyJson(merged.testedCapabilities ?? null),
      stringifyJson(merged.data || {}), existing?.createdAt || now, now,
    ]
  );
  return { previous: existing ? rowToIntel(existing) : null, current: merged };
}

/**
 * Idempotent catalog import. Never deletes: a model that vanishes upstream is
 * flagged presentInCatalog=0 and kept, so user configuration (enabled models,
 * aliases, combos, health history) survives.
 *
 * @returns {"imported"|"updated"|"unchanged"}
 */
export async function upsertDiscoveredModel({ provider, model, name, kind, source, meta }) {
  if (!provider || !model) return "unchanged";
  const id = modelIntelId(provider, model);
  const db = await getAdapter();
  const now = new Date().toISOString();
  let action = "unchanged";

  db.transaction(() => {
    const previous = rowToIntel(db.get(`SELECT ${SELECT_COLS} FROM modelIntel WHERE id = ?`, [id]));
    if (!previous) {
      action = "imported";
    } else {
      // Compare only the fields a sync is allowed to move. Health, quarantine and
      // counters are the test layer's business and must survive a sync.
      const prevMeta = previous.data || {};
      const metaChanged =
        (previous.name || null) !== (name || previous.name || null) ||
        (previous.kind || "llm") !== (kind || previous.kind || "llm") ||
        JSON.stringify(prevMeta.meta || null) !== JSON.stringify(meta ?? prevMeta.meta ?? null);
      if (metaChanged) action = "updated";
      if (!previous.presentInCatalog) action = "updated";
    }

    upsertRow(db, id, provider, model, {
      ...(previous || {}),
      name: name || previous?.name || model,
      kind: kind || previous?.kind || "llm",
      source: source || previous?.source || null,
      discovered: true,
      presentInCatalog: true,
      lastSyncAt: now,
      data: { ...(previous?.data || {}), ...(meta ? { meta } : {}) },
      // First sighting stays UNKNOWN — an untested model is not a healthy one.
      health: previous?.health || HEALTH.UNKNOWN,
    });
  });

  invalidateIntelCache();
  return action;
}

/** Mark every discovered model of a provider absent from the latest catalog. */
export async function markMissing(provider, keepIds) {
  const db = await getAdapter();
  const keep = Array.isArray(keepIds) ? keepIds : [];
  let changed = 0;
  db.transaction(() => {
    const rows = db.all(`SELECT id FROM modelIntel WHERE provider = ? AND discovered = 1`, [provider]);
    const keepSet = new Set(keep);
    for (const row of rows) {
      const modelId = row.id.slice(row.id.indexOf("/") + 1);
      if (keepSet.has(modelId)) continue;
      const res = db.run(
        `UPDATE modelIntel SET presentInCatalog = 0, updatedAt = ? WHERE id = ? AND presentInCatalog != 0`,
        [new Date().toISOString(), row.id]
      );
      changed += res?.changes || 0;
    }
  });
  if (changed) invalidateIntelCache();
  return changed;
}

export async function addModelIntelEvent(event) {
  const db = await getAdapter();
  db.run(
    `INSERT INTO modelIntelEvents (timestamp, modelIntelId, provider, model, health, ok, latencyMs,
        errorCategory, errorScope, checkName, retries, message)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      event.timestamp || new Date().toISOString(),
      event.modelIntelId,
      event.provider || null,
      event.model || null,
      event.health || null,
      event.ok ? 1 : 0,
      event.latencyMs ?? null,
      event.errorCategory || null,
      event.errorScope || null,
      event.check || null,
      event.retries || 0,
      // Redact then truncate: a provider error body routinely echoes the
      // credential that was sent and can quote the whole request back at us.
      event.message ? redactAndTruncate(event.message, 500) : null,
    ]
  );
  invalidateIntelCache();
}

/**
 * Apply one probe outcome to a model row. Returns the resulting row.
 * `patch` carries the state-machine decision made by the caller — this function
 * only persists, so the transition rules stay testable on their own.
 */
export async function updateModelIntelState(provider, model, patch) {
  const id = modelIntelId(provider, model);
  const db = await getAdapter();
  let out = null;
  db.transaction(() => {
    const { current } = upsertRow(db, id, provider, model, patch);
    out = current;
  });
  invalidateIntelCache();
  return out;
}

export async function getModelHistory(modelIntelIdValue, limit = 50) {
  const db = await getAdapter();
  const rows = db.all(
    `SELECT timestamp, health, ok, latencyMs, errorCategory, errorScope, checkName, retries, message
     FROM modelIntelEvents WHERE modelIntelId = ? ORDER BY id DESC LIMIT ?`,
    [modelIntelIdValue, Math.max(1, Math.min(Number(limit) || 50, HISTORY_LIMIT))]
  );
  return rows.map((r) => ({
    timestamp: r.timestamp,
    health: r.health,
    ok: r.ok === 1,
    latencyMs: r.latencyMs,
    errorCategory: r.errorCategory,
    errorScope: r.errorScope,
    check: r.check,
    retries: r.retries,
    message: r.message,
  }));
}

export async function recordSyncRun(run) {
  const db = await getAdapter();
  db.run(
    `INSERT INTO modelIntelSyncs (timestamp, triggerSource, status, provider, imported, updated, unchanged,
        errorCount, durationMs, errors)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      run.timestamp || new Date().toISOString(),
      run.trigger || "manual",
      run.status || "ok",
      run.provider || null,
      run.imported || 0,
      run.updated || 0,
      run.unchanged || 0,
      run.errorCount || 0,
      run.durationMs ?? null,
      stringifyJson(run.errors || []),
    ]
  );
  // Trim the trail.
  db.run(
    `DELETE FROM modelIntelSyncs WHERE id NOT IN (
       SELECT id FROM modelIntelSyncs ORDER BY id DESC LIMIT ?
     )`,
    [SYNC_LOG_LIMIT]
  );
}

export async function getLastSyncRun() {
  const db = await getAdapter();
  const row = db.get(
    `SELECT timestamp, triggerSource, status, provider, imported, updated, unchanged, errorCount, durationMs, errors
     FROM modelIntelSyncs ORDER BY id DESC LIMIT 1`
  );
  if (!row) return null;
  return {
    timestamp: row.timestamp,
    trigger: row.triggerSource,
    status: row.status,
    provider: row.provider,
    imported: row.imported,
    updated: row.updated,
    unchanged: row.unchanged,
    errorCount: row.errorCount,
    durationMs: row.durationMs,
    errors: parseJson(row.errors, []) || [],
  };
}

export async function listSyncRuns(limit = 10) {
  const db = await getAdapter();
  const rows = db.all(
    `SELECT timestamp, triggerSource, status, provider, imported, updated, unchanged, errorCount, durationMs, errors
     FROM modelIntelSyncs ORDER BY id DESC LIMIT ?`,
    [Math.max(1, Math.min(Number(limit) || 10, SYNC_LOG_LIMIT))]
  );
  return rows.map((row) => ({
    timestamp: row.timestamp,
    trigger: row.triggerSource,
    status: row.status,
    provider: row.provider,
    imported: row.imported,
    updated: row.updated,
    unchanged: row.unchanged,
    errorCount: row.errorCount,
    durationMs: row.durationMs,
    errors: parseJson(row.errors, []) || [],
  }));
}

/** Drop the probe trail older than `keep` rows per model. Called after a batch. */
export async function pruneHistory(maxPerModel = HISTORY_LIMIT) {
  const db = await getAdapter();
  db.run(
    `DELETE FROM modelIntelEvents WHERE id NOT IN (
       SELECT e.id FROM modelIntelEvents e
       JOIN (
         SELECT modelIntelId, MAX(id) AS maxId FROM modelIntelEvents GROUP BY modelIntelId
       ) latest ON latest.modelIntelId = e.modelIntelId
       WHERE e.id <= latest.maxId - ?
     )`,
    [Math.max(0, Number(maxPerModel) || HISTORY_LIMIT)]
  );
}
