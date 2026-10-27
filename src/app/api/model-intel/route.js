import { NextResponse } from "next/server";
import {
  getIntelConfig, updateIntelConfig, DEFAULT_INTELLIGENCE_CONFIG,
} from "@/lib/intelligence/config.js";
import { listAdapterIds } from "@/lib/intelligence/adapters/index.js";
import { enrichRow, summarizeModels, FILTER_VALUES } from "@/lib/intelligence/selection.js";
import { runModelTests, getTestRuntimeState, listRecoverable } from "@/lib/intelligence/runner.js";
import { getSyncRuntimeState } from "@/lib/intelligence/sync.js";
import {
  listModelIntel, getLastSyncRun, listSyncRuns, getModelHistory,
} from "@/lib/db/repos/modelIntelRepo.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store" };

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

function intParam(value, fallback, min, max) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") || undefined;
    const health = searchParams.get("health") || undefined;
    const includeMissing = searchParams.get("includeMissing") === "1";
    const limit = intParam(searchParams.get("limit"), 500, 1, 5000);

    const rows = await listModelIntel({
      ...(provider ? { provider } : {}),
      ...(health ? { health } : {}),
      includeMissing,
    });
    const enriched = rows.map(enrichRow);
    const config = await getIntelConfig();

    return json({
      summary: summarizeModels(enriched),
      models: enriched.slice(0, limit),
      total: enriched.length,
      config,
      defaults: DEFAULT_INTELLIGENCE_CONFIG,
      adapters: listAdapterIds(),
      filters: FILTER_VALUES,
      sync: { ...getSyncRuntimeState(), lastRun: await getLastSyncRun(), recent: await listSyncRuns(5) },
      tests: { ...getTestRuntimeState(), recoverable: (await listRecoverable()).length },
    });
  } catch (error) {
    console.error("[modelIntel] summary failed:", error?.message);
    return json({ error: "Failed to load model intelligence summary" }, 500);
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const config = await updateIntelConfig(body || {});
    return json({ config });
  } catch (error) {
    console.error("[modelIntel] config update failed:", error?.message);
    return json({ error: "Failed to update configuration" }, 500);
  }
}

// POST /api/model-intel  { action: "test" | "retest-failed" | "recover", ... }
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || "");

    if (action === "test") {
      const result = await runModelTests({
        provider: typeof body.provider === "string" && body.provider ? body.provider : undefined,
        force: body.force === true,
        limit: intParam(body.limit, 200, 1, 5000),
      });
      return json(result);
    }
    if (action === "retest-failed") {
      const result = await runModelTests({ quarantinedOnly: true, force: true });
      return json(result);
    }
    if (action === "recover") {
      const { runRecoverySweep } = await import("@/lib/intelligence/runner.js");
      const result = await runRecoverySweep();
      return json(result);
    }
    if (action === "history") {
      const modelIntelId = String(body?.modelIntelId || "");
      if (!modelIntelId) return json({ error: "modelIntelId is required" }, 400);
      return json({ history: await getModelHistory(modelIntelId, intParam(body.limit, 50, 1, 200)) });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("[modelIntel] action failed:", error?.message);
    return json({ error: "Action failed" }, 500);
  }
}
