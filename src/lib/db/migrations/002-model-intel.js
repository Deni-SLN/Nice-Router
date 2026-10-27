// Model intelligence tables (discovered catalog + health + history).
// Purely additive: fresh DBs get them from schema.js via 001, existing DBs get
// them here. Nothing is dropped, renamed or retyped, so user configuration in
// providerConnections / combos / kv survives untouched.
import { TABLES, buildCreateTableSql } from "../schema.js";

const TABLES_TOUCHED = ["modelIntel", "modelIntelEvents", "modelIntelSyncs"];

export default {
  version: 2,
  name: "model-intel",
  up(db) {
    for (const name of TABLES_TOUCHED) {
      const def = TABLES[name];
      if (!def) continue;
      db.exec(buildCreateTableSql(name, def));
      for (const idx of def.indexes || []) db.exec(idx);
    }
  },
};
