import { NextResponse } from "next/server";
import { sendTestWebhookPing } from "@/lib/services/webhookEngine.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { webhookId, allowLocal } = body || {};

    if (!webhookId) {
      return NextResponse.json({ ok: false, error: "webhookId is required" }, { status: 400, headers: CORS_HEADERS });
    }

    const result = await sendTestWebhookPing(webhookId, Boolean(allowLocal));
    return NextResponse.json({ ok: result.success, result }, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
