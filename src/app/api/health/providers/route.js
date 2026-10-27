import { NextResponse } from "next/server";
import { getAllProvidersHealth, restoreHealthState } from "@/lib/services/providerHealthMonitor.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function GET() {
  await restoreHealthState().catch(() => {});
  const providersHealth = getAllProvidersHealth();
  return NextResponse.json({ ok: true, data: providersHealth }, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
