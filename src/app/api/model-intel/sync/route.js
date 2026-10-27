import { NextResponse } from "next/server";
import { syncCatalog, getSyncRuntimeState } from "@/lib/intelligence/sync.js";
import { listAdapterIds } from "@/lib/intelligence/adapters/index.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/model-intel/sync  { providers?: string[], trigger?: string }
// Synchronization is idempotent and non-destructive: nothing is deleted, and a
// repeat run reports every model as `unchanged`.
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const known = listAdapterIds();

    let providers;
    if (Array.isArray(body?.providers) && body.providers.length) {
      providers = body.providers.filter((p) => typeof p === "string" && known.includes(p));
      if (!providers.length) {
        return NextResponse.json(
          { error: "No requested provider has a discovery adapter", available: known },
          { status: 400, headers: { "Cache-Control": "no-store" } }
        );
      }
    }

    const trigger = body?.trigger === "schedule" ? "schedule" : "manual";
    const result = await syncCatalog({ providers, trigger, timeoutMs: 20000 });
    return NextResponse.json({ ...result, state: getSyncRuntimeState() }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[modelIntel] sync failed:", error?.message);
    return NextResponse.json(
      { error: "Catalog sync failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { state: getSyncRuntimeState(), adapters: listAdapterIds() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
