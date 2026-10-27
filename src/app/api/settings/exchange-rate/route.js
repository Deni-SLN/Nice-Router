import { NextResponse } from "next/server";
import { getExchangeRate, updateExchangeRate } from "@/lib/services/costIntelligence.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function GET() {
  try {
    const rateInfo = await getExchangeRate();
    return NextResponse.json({ ok: true, data: rateInfo }, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { rate, source } = payload || {};

    if (!rate || isNaN(Number(rate)) || Number(rate) <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid rate: must be a positive number" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const updated = await updateExchangeRate(Number(rate), source || "manual");
    return NextResponse.json({ ok: true, data: updated }, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
