import { NextResponse } from "next/server";
import { getAppAnalytics } from "@/lib/services/appAnalytics.js";
import { getSettings } from "@/lib/localDb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const period = searchParams.get("period") || "all";

    const analytics = await getAppAnalytics({ startDate, endDate, period });
    const settings = await getSettings().catch(() => ({}));

    return NextResponse.json(
      {
        ok: true,
        requireApiKey: settings.requireApiKey === true,
        data: analytics.items,
        summary: analytics.summary,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
