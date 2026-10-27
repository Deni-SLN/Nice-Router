import { getAdapter } from "../driver.js";
import { parseJson, stringifyJson } from "../helpers/jsonCol.js";
import crypto from "crypto";

export function maskWebhookSecret(secret) {
  if (!secret || typeof secret !== "string") return "";
  if (secret.length <= 8) return "********";
  return `${secret.slice(0, 6)}...${secret.slice(-4)}`;
}

export function generateWebhookSecret() {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`;
}

export async function getWebhooks(includeSecret = false) {
  const db = await getAdapter();
  const rows = db.all(`SELECT id, name, url, events, secret, isActive, createdAt, updatedAt FROM webhooks ORDER BY createdAt DESC`);
  return rows.map((r) => ({
    id: r.id,
    name: r.name || "",
    url: r.url,
    events: parseJson(r.events, []),
    secret: includeSecret ? r.secret : maskWebhookSecret(r.secret),
    isActive: Boolean(r.isActive),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function getWebhookById(id, includeSecret = false) {
  const db = await getAdapter();
  const r = db.get(`SELECT id, name, url, events, secret, isActive, createdAt, updatedAt FROM webhooks WHERE id = ?`, [id]);
  if (!r) return null;
  return {
    id: r.id,
    name: r.name || "",
    url: r.url,
    events: parseJson(r.events, []),
    secret: includeSecret ? r.secret : maskWebhookSecret(r.secret),
    isActive: Boolean(r.isActive),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function getActiveWebhooksForEvent(event) {
  const db = await getAdapter();
  const rows = db.all(`SELECT id, name, url, events, secret, isActive, createdAt, updatedAt FROM webhooks WHERE isActive = 1`);
  const matched = [];
  for (const r of rows) {
    const evList = parseJson(r.events, []);
    if (evList.includes(event) || evList.includes("*")) {
      matched.push({
        id: r.id,
        name: r.name || "",
        url: r.url,
        events: evList,
        secret: r.secret, // Needs plain secret for HMAC signing
        isActive: true,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      });
    }
  }
  return matched;
}

export async function createWebhook({ name, url, events = [], secret = null }) {
  const db = await getAdapter();
  const id = `wh_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date().toISOString();
  const plainSecret = secret && typeof secret === "string" && secret.trim() ? secret.trim() : generateWebhookSecret();
  const eventsArr = Array.isArray(events) ? events : [];

  db.run(
    `INSERT INTO webhooks(id, name, url, events, secret, isActive, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, name || "Webhook Endpoint", url, stringifyJson(eventsArr), plainSecret, now, now]
  );

  return {
    id,
    name: name || "Webhook Endpoint",
    url,
    events: eventsArr,
    secret: plainSecret, // Returned once upon creation so the user can copy it
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateWebhook(id, updates = {}) {
  const db = await getAdapter();
  const existing = db.get(`SELECT * FROM webhooks WHERE id = ?`, [id]);
  if (!existing) return null;

  const now = new Date().toISOString();
  const nextName = updates.name !== undefined ? updates.name : existing.name;
  const nextUrl = updates.url !== undefined ? updates.url : existing.url;
  const nextEvents = updates.events !== undefined ? stringifyJson(updates.events) : existing.events;
  const nextSecret = updates.secret ? updates.secret : existing.secret;
  const nextActive = updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : existing.isActive;

  db.run(
    `UPDATE webhooks SET name = ?, url = ?, events = ?, secret = ?, isActive = ?, updatedAt = ? WHERE id = ?`,
    [nextName, nextUrl, nextEvents, nextSecret, nextActive, now, id]
  );

  return getWebhookById(id, false);
}

export async function deleteWebhook(id) {
  const db = await getAdapter();
  db.run(`DELETE FROM webhookDeliveryLogs WHERE webhookId = ?`, [id]);
  db.run(`DELETE FROM webhooks WHERE id = ?`, [id]);
  return true;
}

export async function saveDeliveryLog({
  webhookId,
  eventId,
  event,
  statusCode = null,
  success = false,
  attempts = 1,
  durationMs = 0,
  error = null,
}) {
  try {
    const db = await getAdapter();
    const id = `log_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO webhookDeliveryLogs(id, webhookId, eventId, event, statusCode, success, attempts, durationMs, error, createdAt)
       VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, webhookId, eventId, event, statusCode, success ? 1 : 0, attempts, durationMs, error ? String(error).slice(0, 500) : null, now]
    );
    return id;
  } catch (err) {
    console.warn("[webhooksRepo] saveDeliveryLog error:", err.message);
    return null;
  }
}

export async function getDeliveryLogs({ webhookId = null, limit = 50, offset = 0 } = {}) {
  const db = await getAdapter();
  const params = [];
  let where = "";
  if (webhookId) {
    where = "WHERE webhookId = ?";
    params.push(webhookId);
  }
  params.push(Math.min(200, Math.max(1, limit)));
  params.push(Math.max(0, offset));

  const rows = db.all(
    `SELECT id, webhookId, eventId, event, statusCode, success, attempts, durationMs, error, createdAt
     FROM webhookDeliveryLogs ${where}
     ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
    params
  );

  return rows.map((r) => ({
    id: r.id,
    webhookId: r.webhookId,
    eventId: r.eventId,
    event: r.event,
    statusCode: r.statusCode,
    success: Boolean(r.success),
    attempts: r.attempts,
    durationMs: r.durationMs,
    error: r.error,
    createdAt: r.createdAt,
  }));
}

export async function pruneDeliveryLogs({ maxDays = 30, maxRows = 10000 } = {}) {
  try {
    const db = await getAdapter();
    const cutoff = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000).toISOString();
    db.run(`DELETE FROM webhookDeliveryLogs WHERE createdAt < ?`, [cutoff]);

    // Cap total rows to maxRows
    db.run(
      `DELETE FROM webhookDeliveryLogs WHERE id NOT IN (
         SELECT id FROM webhookDeliveryLogs ORDER BY createdAt DESC LIMIT ?
       )`,
      [maxRows]
    );
  } catch (err) {
    console.warn("[webhooksRepo] pruneDeliveryLogs error:", err.message);
  }
}
