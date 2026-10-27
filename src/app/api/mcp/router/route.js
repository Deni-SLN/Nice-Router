import { NextResponse } from "next/server";
import { handleMcpRpcRequest } from "@/lib/mcp/niceRouterMcpServer.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function POST(request) {
  try {
    const jsonReq = await request.json();
    const result = await handleMcpRpcRequest(jsonReq);
    if (!result) {
      return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
    }
    return NextResponse.json(result, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: `Parse error: ${err.message}` },
      },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
