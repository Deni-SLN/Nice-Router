import { NextResponse } from "next/server";
import { getCustomModels, addCustomModel, deleteCustomModel, clearCustomModelsByProvider } from "@/models";
import { CAPACITY_META, isSttTransport } from "@/shared/constants/models";

export const dynamic = "force-dynamic";

// Whitelist capability keys to boolean values — ignore anything else
function sanitizeCaps(caps) {
  if (!caps || typeof caps !== "object") return null;
  const clean = {};
  for (const key of Object.keys(CAPACITY_META)) {
    if (typeof caps[key] === "boolean") clean[key] = caps[key];
  }
  return Object.keys(clean).length ? clean : null;
}

// Accepted STT transport markers live in the shared whitelist
// (src/shared/constants/models STT_TRANSPORT_META) — the dashboard transport
// select and this validator must agree on one set, so neither owns a copy.
// Unknown or mistyped values are silently dropped, the same policy
// sanitizeCaps applies to capability keys.
function sanitizeTransport(transport, type) {
  if (type !== "stt" || !isSttTransport(transport)) return null;
  return transport.trim();
}

// GET /api/models/custom - List all custom models
export async function GET() {
  try {
    const models = await getCustomModels();
    return NextResponse.json({ models });
  } catch (error) {
    console.log("Error fetching custom models:", error);
    return NextResponse.json({ error: "Failed to fetch custom models" }, { status: 500 });
  }
}

// POST /api/models/custom - Add custom model (supports single or batch array)
export async function POST(request) {
  try {
    const body = await request.json();
    if (Array.isArray(body?.models)) {
      let count = 0;
      for (const item of body.models) {
        if (!item.providerAlias || !item.id) continue;
        const cleanCaps = sanitizeCaps(item.caps);
        const cleanTransport = sanitizeTransport(item.transport, item.type || "llm");
        const added = await addCustomModel({
          providerAlias: item.providerAlias,
          id: item.id,
          type: item.type || "llm",
          name: item.name || item.id,
          ...(cleanCaps ? { caps: cleanCaps } : {}),
          ...(cleanTransport ? { transport: cleanTransport } : {}),
        });
        if (added) count++;
      }
      return NextResponse.json({ success: true, count });
    }

    const { providerAlias, id, type, name, caps, transport } = body;
    if (!providerAlias || !id) {
      return NextResponse.json({ error: "providerAlias and id required" }, { status: 400 });
    }
    const cleanCaps = sanitizeCaps(caps);
    const cleanTransport = sanitizeTransport(transport, type || "llm");
    const added = await addCustomModel({ providerAlias, id, type: type || "llm", name, ...(cleanCaps ? { caps: cleanCaps } : {}), ...(cleanTransport ? { transport: cleanTransport } : {}) });
    return NextResponse.json({ success: true, added });
  } catch (error) {
    console.log("Error adding custom model:", error);
    return NextResponse.json({ error: "Failed to add custom model" }, { status: 500 });
  }
}

// DELETE /api/models/custom?providerAlias=xxx&id=yyy&type=zzz or ?providerAlias=xxx&all=true
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerAlias = searchParams.get("providerAlias");
    const isAll = searchParams.get("all") === "true";
    if (isAll && providerAlias) {
      await clearCustomModelsByProvider(providerAlias);
      return NextResponse.json({ success: true, cleared: true });
    }

    const id = searchParams.get("id");
    const type = searchParams.get("type") || "llm";
    if (!providerAlias || !id) {
      return NextResponse.json({ error: "providerAlias and id required" }, { status: 400 });
    }
    await deleteCustomModel({ providerAlias, id, type });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("Error deleting custom model:", error);
    return NextResponse.json({ error: "Failed to delete custom model" }, { status: 500 });
  }
}
