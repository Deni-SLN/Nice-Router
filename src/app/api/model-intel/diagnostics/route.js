import { NextResponse } from "next/server";
import { listModelIntel, getModelHistory } from "@/lib/db/repos/modelIntelRepo.js";
import { enrichRow, sortModels } from "@/lib/intelligence/selection.js";
import { listRecoverable } from "@/lib/intelligence/override.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store" };

// GET /api/model-intel/diagnostics
//
// The dedicated view for models hidden from the active catalog. Nothing here is
// deleted: quarantined models keep their row, their history and their metadata,
// and every one can be retested or restored.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") || undefined;

    const quarantinedRows = await listModelIntel({ quarantined: true, ...(provider ? { provider } : {}) });
    const failedRows = await listModelIntel({ health: "FAIL", ...(provider ? { provider } : {}) });
    const recoverableIds = new Set((await listRecoverable()).map((r) => r.id));

    // De-duplicate: a quarantined model is also FAIL.
    const byId = new Map();
    for (const row of [...quarantinedRows, ...failedRows]) byId.set(row.id, row);

    const models = sortModels([...byId.values()].map(enrichRow)).map((m) => ({
      ...m,
      autoRetestDue: recoverableIds.has(m.id),
    }));

    const historyFor = searchParams.get("history");
    let history = null;
    if (historyFor) {
      const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit"), 10) || 50, 1), 200);
      history = { modelIntelId: historyFor, events: await getModelHistory(historyFor, limit) };
    }

    return NextResponse.json({ models, history }, { headers: NO_STORE });
  } catch (error) {
    console.error("[modelIntel] diagnostics failed:", error?.message);
    return NextResponse.json({ error: "Failed to load diagnostics" }, { status: 500, headers: NO_STORE });
  }
}
