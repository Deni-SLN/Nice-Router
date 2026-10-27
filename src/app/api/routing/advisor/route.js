import { NextResponse } from "next/server";
import { generateRouterAdvisories } from "@/lib/services/routerAdvisor.js";
import { getCombos } from "@/lib/db/repos/combosRepo.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function GET() {
  try {
    const combos = await getCombos().catch(() => []);
    const advisories = generateRouterAdvisories({ combos });
    return NextResponse.json({ ok: true, data: advisories }, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
