import { NextResponse } from "next/server";
import { getAlerts, resolveAlert } from "@/lib/services/alertCenter.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const severity = searchParams.get("severity");
    const unresolvedOnly = searchParams.get("unresolvedOnly") === "true";

    const alerts = getAlerts({ limit, severity, unresolvedOnly });
    return NextResponse.json({ ok: true, data: alerts }, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { alertId, action } = payload || {};

    if (action === "resolve" && alertId) {
      const success = resolveAlert(alertId);
      return NextResponse.json({ ok: success, alertId }, { headers: CORS_HEADERS });
    }

    return NextResponse.json({ ok: false, error: "Invalid action or alertId" }, { status: 400, headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
