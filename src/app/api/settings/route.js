import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/localDb";
import { resetComboRotation } from "open-sse/services/combo";
import { applyOutboundProxyEnv } from "@/shared/utils/outboundProxy";
import { cookies } from "next/headers";
import { getDashboardAuthSession, setDashboardAuthCookie, DEFAULT_PASSWORD } from "@/lib/auth/dashboardSession";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SETTINGS_RESPONSE_HEADERS = {
  "Cache-Control": "no-store"
};

// Secrets must never be mass-assigned from request body (CWE-915)
const PROTECTED_SETTING_KEYS = ["password", "mitmSudoEncrypted"];

export async function GET() {
  try {
    const settings = await getSettings();
    const { password, oidcClientSecret, ...safeSettings } = settings;
    safeSettings.oidcConfigured = !!(safeSettings.oidcIssuerUrl && safeSettings.oidcClientId && oidcClientSecret);
    
    const enableRequestLogs = process.env.ENABLE_REQUEST_LOGS === "true";
    const enableTranslator = process.env.ENABLE_TRANSLATOR === "true";
    
    return NextResponse.json({ 
      ...safeSettings, 
      enableRequestLogs,
      enableTranslator,
      hasPassword: !!password
    }, { headers: SETTINGS_RESPONSE_HEADERS });
  } catch (error) {
    console.log("Error getting settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    const session = token ? await getDashboardAuthSession(token) : null;

    const body = await request.json();

    // Strip protected secrets before any internal handling sets them
    for (const key of PROTECTED_SETTING_KEYS) delete body[key];

    // During restricted initial setup, ONLY password updates are allowed
    if (session?.setupOnly) {
      if (!body.newPassword) {
        return NextResponse.json({ error: "Only password updates are permitted during initial setup" }, { status: 403 });
      }
      for (const k of Object.keys(body)) {
        if (k !== "newPassword" && k !== "currentPassword") {
          delete body[k];
        }
      }
    }

    let passwordWasUpdated = false;

    // If updating password, hash it and validate policy
    if (body.newPassword) {
      if (typeof body.newPassword !== "string") {
        return NextResponse.json({ error: "Invalid password format" }, { status: 400 });
      }
      const newPw = body.newPassword.trim();
      if (newPw.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters long" }, { status: 400 });
      }
      const initialPw = process.env.INITIAL_PASSWORD || DEFAULT_PASSWORD;
      if (newPw === "123456" || newPw === DEFAULT_PASSWORD || newPw === initialPw) {
        return NextResponse.json({ error: "New password cannot be the default password" }, { status: 400 });
      }

      const settings = await getSettings();
      const currentHash = settings.password;

      // Verify current password if it exists
      if (currentHash) {
        if (!body.currentPassword) {
          return NextResponse.json({ error: "Current password required" }, { status: 400 });
        }
        const isValid = await bcrypt.compare(body.currentPassword, currentHash);
        if (!isValid) {
          return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
        }
      } else {
        // First time setting password from default "123456"
        if (body.currentPassword && body.currentPassword !== "123456" && body.currentPassword !== DEFAULT_PASSWORD && body.currentPassword !== initialPw) {
           return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
        }
      }

      const salt = await bcrypt.genSalt(10);
      body.password = await bcrypt.hash(newPw, salt);
      body.passwordChangedAt = new Date().toISOString();
      passwordWasUpdated = true;
      delete body.newPassword;
      delete body.currentPassword;
    }

    if (Object.prototype.hasOwnProperty.call(body, "oidcClientSecret")) {
      if (!body.oidcClientSecret || !String(body.oidcClientSecret).trim()) {
        delete body.oidcClientSecret;
      }
    }

    const settings = await updateSettings(body);

    // Apply outbound proxy settings immediately (no restart required)
    if (
      Object.prototype.hasOwnProperty.call(body, "outboundProxyEnabled") ||
      Object.prototype.hasOwnProperty.call(body, "outboundProxyUrl") ||
      Object.prototype.hasOwnProperty.call(body, "outboundNoProxy")
    ) {
      applyOutboundProxyEnv(settings);
    }

    // Invalidate combo rotation state when strategy settings change
    if (
      Object.prototype.hasOwnProperty.call(body, "comboStrategy") ||
      Object.prototype.hasOwnProperty.call(body, "comboStickyRoundRobinLimit") ||
      Object.prototype.hasOwnProperty.call(body, "comboStrategies")
    ) {
      resetComboRotation();
    }

    if (
      Object.prototype.hasOwnProperty.call(body, "claudeAutoPing") ||
      Object.prototype.hasOwnProperty.call(body, "codexAutoPing")
    ) {
      // Keep the scheduler absent when no account opted in; load its provider graph only on demand.
      import("@/shared/services/quotaAutoPing")
        .then(({ configureQuotaAutoPing }) => {
          configureQuotaAutoPing(settings);
        })
        .catch((error) => console.warn("[AutoPing] settings update failed:", error.message));
    }

    if (passwordWasUpdated) {
      await setDashboardAuthCookie(cookieStore, request, {
        setupOnly: false,
        mustChangePassword: false,
        pwt: settings.passwordChangedAt,
      });
    }

    const { password, oidcClientSecret, ...safeSettings } = settings;
    safeSettings.oidcConfigured = !!(safeSettings.oidcIssuerUrl && safeSettings.oidcClientId && oidcClientSecret);
    safeSettings.passwordUpdated = passwordWasUpdated;
    return NextResponse.json(safeSettings, { headers: SETTINGS_RESPONSE_HEADERS });
  } catch (error) {
    console.log("Error updating settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
