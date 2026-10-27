import { NextResponse } from "next/server";
import { setModelOverride, restoreModel, restoreAllQuarantined, sanitizeOverride } from "@/lib/intelligence/override.js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store" };


// POST /api/model-intel/restore
//   { provider, model, override? }        set / clear a manual override
//   { provider, model, restore: true }    release a quarantined model
//   { restoreAll: true }                  release every quarantined model
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: NO_STORE });
    }

    if (body.restoreAll === true) {
      const result = await restoreAllQuarantined();
      return NextResponse.json(result, { headers: NO_STORE });
    }

    const provider = typeof body.provider === "string" ? body.provider.slice(0, 120) : "";
    const model = typeof body.model === "string" ? body.model.slice(0, 300) : "";
    if (!provider || !model) {
      return NextResponse.json({ error: "provider and model are required" }, { status: 400, headers: NO_STORE });
    }

    if (Object.prototype.hasOwnProperty.call(body, "override")) {
      const override = sanitizeOverride(body.override);
      if (body.override != null && body.override !== "" && !override) {
        return NextResponse.json({ error: "Invalid override value" }, { status: 400, headers: NO_STORE });
      }
      const updated = await setModelOverride(provider, model, override, {
        reason: typeof body.reason === "string" ? body.reason.slice(0, 200) : undefined,
      });
      return NextResponse.json({ model: updated }, { headers: NO_STORE });
    }

    const updated = await restoreModel(provider, model, {
      reason: typeof body.reason === "string" ? body.reason.slice(0, 200) : undefined,
    });
    return NextResponse.json({ model: updated }, { headers: NO_STORE });
  } catch (error) {
    console.error("[modelIntel] restore failed:", error?.message);
    return NextResponse.json({ error: "Restore failed" }, { status: 500, headers: NO_STORE });
  }
}
