import { v4 as uuidv4 } from "uuid";
import { getAdapter } from "../driver.js";
import { parseJson, stringifyJson } from "../helpers/jsonCol.js";

let columnEnsured = false;
async function ensureAutoSyncColumn(db) {
  if (columnEnsured) return;
  try {
    db.run(`ALTER TABLE combos ADD COLUMN autoSyncFree INTEGER DEFAULT 0`);
  } catch {
    // Column already exists or table not ready
  }
  try {
    db.run(`ALTER TABLE combos ADD COLUMN autoSyncCategory TEXT DEFAULT NULL`);
  } catch {
    // Column already exists or table not ready
  }
  columnEnsured = true;
}

function rowToCombo(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    models: parseJson(row.models, []),
    autoSyncFree: Boolean(row.autoSyncFree),
    autoSyncCategory: row.autoSyncCategory || (row.autoSyncFree ? "free" : null),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getCombos() {
  const db = await getAdapter();
  await ensureAutoSyncColumn(db);
  const rows = db.all(`SELECT * FROM combos ORDER BY createdAt ASC`);
  return rows.map(rowToCombo);
}

export async function getComboById(id) {
  const db = await getAdapter();
  await ensureAutoSyncColumn(db);
  const row = db.get(`SELECT * FROM combos WHERE id = ?`, [id]);
  return rowToCombo(row);
}

export async function getComboByName(name) {
  const db = await getAdapter();
  await ensureAutoSyncColumn(db);
  const row = db.get(`SELECT * FROM combos WHERE name = ?`, [name]);
  return rowToCombo(row);
}

export async function createCombo(data) {
  const db = await getAdapter();
  await ensureAutoSyncColumn(db);
  const now = new Date().toISOString();
  const combo = {
    id: uuidv4(),
    name: data.name,
    kind: data.kind || null,
    models: data.models || [],
    autoSyncFree: data.autoSyncFree ? 1 : 0,
    autoSyncCategory: data.autoSyncCategory || (data.autoSyncFree ? "free" : null),
    createdAt: now,
    updatedAt: now,
  };
  db.run(
    `INSERT INTO combos(id, name, kind, models, autoSyncFree, autoSyncCategory, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
    [combo.id, combo.name, combo.kind, stringifyJson(combo.models), combo.autoSyncFree, combo.autoSyncCategory, combo.createdAt, combo.updatedAt]
  );
  return { ...combo, autoSyncFree: Boolean(combo.autoSyncFree) };
}

export async function updateCombo(id, data) {
  const db = await getAdapter();
  await ensureAutoSyncColumn(db);
  let result = null;
  db.transaction(() => {
    const row = db.get(`SELECT * FROM combos WHERE id = ?`, [id]);
    if (!row) return;
    const existing = rowToCombo(row);
    const merged = {
      ...existing,
      ...data,
      autoSyncFree: data.autoSyncFree !== undefined ? (data.autoSyncFree ? 1 : 0) : (existing.autoSyncFree ? 1 : 0),
      autoSyncCategory: data.autoSyncCategory !== undefined ? data.autoSyncCategory : existing.autoSyncCategory,
      updatedAt: new Date().toISOString(),
    };
    db.run(
      `UPDATE combos SET name = ?, kind = ?, models = ?, autoSyncFree = ?, autoSyncCategory = ?, updatedAt = ? WHERE id = ?`,
      [merged.name, merged.kind, stringifyJson(merged.models || []), merged.autoSyncFree, merged.autoSyncCategory, merged.updatedAt, id]
    );
    result = { ...merged, autoSyncFree: Boolean(merged.autoSyncFree) };
  });
  return result;
}

export async function deleteCombo(id) {
  const db = await getAdapter();
  await ensureAutoSyncColumn(db);
  const res = db.run(`DELETE FROM combos WHERE id = ?`, [id]);
  return (res?.changes ?? 0) > 0;
}
