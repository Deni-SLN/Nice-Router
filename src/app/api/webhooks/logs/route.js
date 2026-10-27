import { NextResponse } from "next/server";
import { getDeliveryLogs } from "@/lib/db/repos/webhooksRepo.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const webhookId = searchParams.get("webhookId") || null;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const logs = await getDeliveryLogs({ webhookId, limit, offset });
    return NextResponse.json({ ok: true, data: logs }, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
