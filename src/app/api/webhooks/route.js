import { NextResponse } from "next/server";
import {
  getWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
} from "@/lib/db/repos/webhooksRepo.js";
import { validateWebhookUrl, WEBHOOK_EVENTS } from "@/lib/services/webhookEngine.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export async function GET() {
  try {
    const list = await getWebhooks(false); // Secrets masked
    return NextResponse.json(
      {
        ok: true,
        data: list,
        availableEvents: Object.values(WEBHOOK_EVENTS),
      },
      { headers: CORS_HEADERS }
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, url, events, secret } = body || {};

    if (!url || typeof url !== "string") {
      return NextResponse.json({ ok: false, error: "Valid URL is required" }, { status: 400, headers: CORS_HEADERS });
    }

    // SSRF Check
    const validation = await validateWebhookUrl(url);
    if (!validation.valid) {
      return NextResponse.json(
        { ok: false, error: `Invalid or restricted webhook URL: ${validation.reason}` },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const created = await createWebhook({
      name: name || "Webhook Endpoint",
      url,
      events: Array.isArray(events) ? events : Object.values(WEBHOOK_EVENTS),
      secret: secret || null,
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201, headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body || {};

    if (!id) {
      return NextResponse.json({ ok: false, error: "Webhook id is required" }, { status: 400, headers: CORS_HEADERS });
    }

    if (updates.url) {
      const validation = await validateWebhookUrl(updates.url);
      if (!validation.valid) {
        return NextResponse.json(
          { ok: false, error: `Invalid or restricted webhook URL: ${validation.reason}` },
          { status: 400, headers: CORS_HEADERS }
        );
      }
    }

    const updated = await updateWebhook(id, updates);
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Webhook not found" }, { status: 404, headers: CORS_HEADERS });
    }

    return NextResponse.json({ ok: true, data: updated }, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "Webhook id is required" }, { status: 400, headers: CORS_HEADERS });
    }

    await deleteWebhook(id);
    return NextResponse.json({ ok: true, deletedId: id }, { headers: CORS_HEADERS });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
