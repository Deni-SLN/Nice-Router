import { NextResponse } from "next/server";
import { simulateSmartRoute } from "@/lib/services/smartRouting.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function POST(request) {
  try {
    const payload = await request.json();
    const { requestedModel, candidateModels, policy, taskType, body } = payload || {};

    if (!requestedModel || !Array.isArray(candidateModels)) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields: requestedModel and candidateModels (array)" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const decision = simulateSmartRoute({
      requestedModel,
      candidateModels,
      policy,
      taskType,
      body,
    });

    return NextResponse.json({ ok: true, data: decision }, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
