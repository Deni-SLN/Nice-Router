// ⚠️ AGENT/DEV: Bump this by +1 EVERY TIME you change the schema below
// (add/remove/alter a table, column, or index in TABLES). It drives the
// pre-change safety backup in migrate.js: when the stored version is lower,
// one lightweight DB backup is taken before applying schema changes. Forgetting
// to bump only skips that backup — it does NOT break the additive auto-sync.
export const SCHEMA_VERSION = 4;

export const PRAGMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 30000000;
PRAGMA cache_size = -64000;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
`;

// Declarative current schema. Used by syncSchemaFromTables() to
// auto-add missing tables/columns/indexes after versioned migrations.
// For destructive changes (drop/rename/type-change), write a migration file.
export const TABLES = {
  _meta: {
    columns: {
      key: "TEXT PRIMARY KEY",
      value: "TEXT NOT NULL",
    },
  },
  settings: {
    columns: {
      id: "INTEGER PRIMARY KEY CHECK (id = 1)",
      data: "TEXT NOT NULL",
    },
  },
  providerConnections: {
    columns: {
      id: "TEXT PRIMARY KEY",
      provider: "TEXT NOT NULL",
      authType: "TEXT NOT NULL",
      name: "TEXT",
      email: "TEXT",
      priority: "INTEGER",
      isActive: "INTEGER DEFAULT 1",
      data: "TEXT NOT NULL",
      createdAt: "TEXT NOT NULL",
      updatedAt: "TEXT NOT NULL",
    },
    indexes: [
      "CREATE INDEX IF NOT EXISTS idx_pc_provider ON providerConnections(provider)",
      "CREATE INDEX IF NOT EXISTS idx_pc_provider_active ON providerConnections(provider, isActive)",
      "CREATE INDEX IF NOT EXISTS idx_pc_priority ON providerConnections(provider, priority)",
    ],
  },
  providerNodes: {
    columns: {
      id: "TEXT PRIMARY KEY",
      type: "TEXT",
      name: "TEXT",
      data: "TEXT NOT NULL",
      createdAt: "TEXT NOT NULL",
      updatedAt: "TEXT NOT NULL",
    },
    indexes: ["CREATE INDEX IF NOT EXISTS idx_pn_type ON providerNodes(type)"],
  },
  proxyPools: {
    columns: {
      id: "TEXT PRIMARY KEY",
      isActive: "INTEGER DEFAULT 1",
      testStatus: "TEXT",
      data: "TEXT NOT NULL",
      createdAt: "TEXT NOT NULL",
      updatedAt: "TEXT NOT NULL",
    },
    indexes: [
      "CREATE INDEX IF NOT EXISTS idx_pp_active ON proxyPools(isActive)",
      "CREATE INDEX IF NOT EXISTS idx_pp_status ON proxyPools(testStatus)",
    ],
  },
  apiKeys: {
    columns: {
      id: "TEXT PRIMARY KEY",
      key: "TEXT UNIQUE NOT NULL",
      name: "TEXT",
      machineId: "TEXT",
      isActive: "INTEGER DEFAULT 1",
      createdAt: "TEXT NOT NULL",
      // Per-key access control. Additive columns, picked up by
      // syncSchemaFromTables() on boot; existing rows read as unrestricted (0).
      accessRestricted: "INTEGER DEFAULT 0",
      accessAllow: "TEXT",
    },
    indexes: ["CREATE INDEX IF NOT EXISTS idx_ak_key ON apiKeys(key)"],
  },
  combos: {
    columns: {
      id: "TEXT PRIMARY KEY",
      name: "TEXT UNIQUE NOT NULL",
      kind: "TEXT",
      models: "TEXT NOT NULL",
      createdAt: "TEXT NOT NULL",
      updatedAt: "TEXT NOT NULL",
    },
    indexes: ["CREATE INDEX IF NOT EXISTS idx_combo_name ON combos(name)"],
  },
  kv: {
    columns: {
      scope: "TEXT NOT NULL",
      key: "TEXT NOT NULL",
      value: "TEXT NOT NULL",
    },
    primaryKey: "PRIMARY KEY (scope, key)",
    indexes: ["CREATE INDEX IF NOT EXISTS idx_kv_scope ON kv(scope)"],
  },
  usageHistory: {
    columns: {
      id: "INTEGER PRIMARY KEY AUTOINCREMENT",
      timestamp: "TEXT NOT NULL",
      provider: "TEXT",
      model: "TEXT",
      connectionId: "TEXT",
      apiKey: "TEXT",
      endpoint: "TEXT",
      promptTokens: "INTEGER DEFAULT 0",
      completionTokens: "INTEGER DEFAULT 0",
      cost: "REAL DEFAULT 0",
      status: "TEXT",
      tokens: "TEXT",
      meta: "TEXT",
    },
    indexes: [
      "CREATE INDEX IF NOT EXISTS idx_uh_ts ON usageHistory(timestamp DESC)",
      "CREATE INDEX IF NOT EXISTS idx_uh_provider ON usageHistory(provider)",
      "CREATE INDEX IF NOT EXISTS idx_uh_model ON usageHistory(model)",
      "CREATE INDEX IF NOT EXISTS idx_uh_conn ON usageHistory(connectionId)",
    ],
  },
  usageDaily: {
    columns: {
      dateKey: "TEXT PRIMARY KEY",
      data: "TEXT NOT NULL",
    },
  },
  requestDetails: {
    columns: {
      id: "TEXT PRIMARY KEY",
      timestamp: "TEXT NOT NULL",
      provider: "TEXT",
      model: "TEXT",
      connectionId: "TEXT",
      status: "TEXT",
      data: "TEXT NOT NULL",
    },
    indexes: [
      "CREATE INDEX IF NOT EXISTS idx_rd_ts ON requestDetails(timestamp DESC)",
      "CREATE INDEX IF NOT EXISTS idx_rd_provider ON requestDetails(provider)",
      "CREATE INDEX IF NOT EXISTS idx_rd_model ON requestDetails(model)",
      "CREATE INDEX IF NOT EXISTS idx_rd_conn ON requestDetails(connectionId)",
    ],
  },
  // ── Model intelligence ────────────────────────────────────────────────────
  // Discovered/observed model metadata + health. Keyed by "provider/model" so a
  // provider-scoped health verdict never bleeds onto another provider's model of
  // the same name. `data` holds adapter metadata (context, modalities, params,
  // pricing) and is the only place secrets must never land.
  modelIntel: {
    columns: {
      id: "TEXT PRIMARY KEY",
      provider: "TEXT NOT NULL",
      model: "TEXT NOT NULL",
      name: "TEXT",
      kind: "TEXT DEFAULT 'llm'",
      source: "TEXT",
      discovered: "INTEGER DEFAULT 0",
      presentInCatalog: "INTEGER DEFAULT 1",
      // PASS | DEGRADED | FAIL | UNKNOWN — never anything else.
      health: "TEXT DEFAULT 'UNKNOWN'",
      healthReason: "TEXT",
      errorCategory: "TEXT",
      errorScope: "TEXT",
      consecutiveFailures: "INTEGER DEFAULT 0",
      consecutivePasses: "INTEGER DEFAULT 0",
      quarantineCount: "INTEGER DEFAULT 0",
      quarantined: "INTEGER DEFAULT 0",
      manualOverride: "TEXT",
      lastTestedAt: "TEXT",
      lastSyncAt: "TEXT",
      quarantinedUntil: "TEXT",
      latencyMs: "INTEGER",
      avgLatencyMs: "REAL",
      lastError: "TEXT",
      retryCount: "INTEGER DEFAULT 0",
      testedCapabilities: "TEXT",
      data: "TEXT NOT NULL",
      createdAt: "TEXT NOT NULL",
      updatedAt: "TEXT NOT NULL",
    },
    indexes: [
      "CREATE INDEX IF NOT EXISTS idx_mi_provider ON modelIntel(provider)",
      "CREATE INDEX IF NOT EXISTS idx_mi_health ON modelIntel(health)",
      "CREATE INDEX IF NOT EXISTS idx_mi_quarantined ON modelIntel(quarantined)",
    ],
  },
  // Append-only probe history: per-model latency and failure trail for the
  // diagnostics page. Capped by the repo (HISTORY_LIMIT) so it cannot grow
  // without bound.
  modelIntelEvents: {
    columns: {
      id: "INTEGER PRIMARY KEY AUTOINCREMENT",
      timestamp: "TEXT NOT NULL",
      modelIntelId: "TEXT NOT NULL",
      provider: "TEXT",
      model: "TEXT",
      health: "TEXT",
      ok: "INTEGER DEFAULT 0",
      latencyMs: "INTEGER",
      errorCategory: "TEXT",
      errorScope: "TEXT",
      // "check" is a SQLite keyword — the column is named checkName.
      checkName: "TEXT",
      retries: "INTEGER DEFAULT 0",
      message: "TEXT",
    },
    indexes: [
      "CREATE INDEX IF NOT EXISTS idx_mie_ts ON modelIntelEvents(timestamp DESC)",
      "CREATE INDEX IF NOT EXISTS idx_mie_model ON modelIntelEvents(modelIntelId, timestamp DESC)",
    ],
  },
  // One row per catalog sync attempt so "last sync / imported / updated / errors"
  // survives a restart.
  modelIntelSyncs: {
    columns: {
      id: "INTEGER PRIMARY KEY AUTOINCREMENT",
      timestamp: "TEXT NOT NULL",
      // "trigger" is a SQLite keyword — the column is named triggerSource.
      triggerSource: "TEXT",
      status: "TEXT",
      provider: "TEXT",
      imported: "INTEGER DEFAULT 0",
      updated: "INTEGER DEFAULT 0",
      unchanged: "INTEGER DEFAULT 0",
      errorCount: "INTEGER DEFAULT 0",
      durationMs: "INTEGER",
      errors: "TEXT",
    },
    indexes: ["CREATE INDEX IF NOT EXISTS idx_mis_ts ON modelIntelSyncs(timestamp DESC)"],
  },
  webhooks: {
    columns: {
      id: "TEXT PRIMARY KEY",
      name: "TEXT",
      url: "TEXT NOT NULL",
      events: "TEXT NOT NULL",
      secret: "TEXT NOT NULL",
      isActive: "INTEGER DEFAULT 1",
      createdAt: "TEXT NOT NULL",
      updatedAt: "TEXT NOT NULL",
    },
    indexes: [
      "CREATE INDEX IF NOT EXISTS idx_wh_active ON webhooks(isActive)",
    ],
  },
  webhookDeliveryLogs: {
    columns: {
      id: "TEXT PRIMARY KEY",
      webhookId: "TEXT NOT NULL",
      eventId: "TEXT NOT NULL",
      event: "TEXT NOT NULL",
      statusCode: "INTEGER",
      success: "INTEGER NOT NULL",
      attempts: "INTEGER DEFAULT 1",
      durationMs: "INTEGER",
      error: "TEXT",
      createdAt: "TEXT NOT NULL",
    },
    indexes: [
      "CREATE INDEX IF NOT EXISTS idx_wh_logs_wh ON webhookDeliveryLogs(webhookId)",
      "CREATE INDEX IF NOT EXISTS idx_wh_logs_created ON webhookDeliveryLogs(createdAt DESC)",
    ],
  },
};

export function buildCreateTableSql(name, def) {
  const cols = Object.entries(def.columns).map(([k, v]) => `${k} ${v}`);
  if (def.primaryKey) cols.push(def.primaryKey);
  return `CREATE TABLE IF NOT EXISTS ${name} (${cols.join(", ")})`;
}
