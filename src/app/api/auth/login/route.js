import { NextResponse } from "next/server";
import { getSettings } from "@/lib/localDb";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { setDashboardAuthCookie, isDefaultPasswordPending, DEFAULT_PASSWORD } from "@/lib/auth/dashboardSession";
import { isOidcConfigured } from "@/lib/auth/oidc";
import { isSamlConfigured } from "@/lib/auth/saml.js";
import { checkLock, recordFail, recordSuccess, getClientIp } from "@/lib/auth/loginLimiter";

const RESET_HINT = "Forgot password? Reset via Nice Router CLI or configure initial password in settings.";
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function isTunnelRequest(request, settings) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const tunnelHost = settings.tunnelUrl ? new URL(settings.tunnelUrl).hostname.toLowerCase() : "";
  const tailscaleHost = settings.tailscaleUrl ? new URL(settings.tailscaleUrl).hostname.toLowerCase() : "";
  return (tunnelHost && host === tunnelHost) || (tailscaleHost && host === tailscaleHost);
}

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const lock = checkLock(ip);
    if (lock.locked) {
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${lock.retryAfter}s. ${RESET_HINT}`, retryAfter: lock.retryAfter, resetHint: RESET_HINT },
        { status: 429, headers: { "Retry-After": String(lock.retryAfter) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const password = typeof body?.password === "string" ? body.password : "";
    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const settings = await getSettings();

    // Block login via tunnel/tailscale if dashboard access is disabled
    if (isTunnelRequest(request, settings) && settings.tunnelDashboardAccess !== true) {
      return NextResponse.json({ error: "Dashboard access via tunnel is disabled" }, { status: 403 });
    }

    const storedHash = settings.password;

    if (settings.authMode === "sso" || settings.authMode === "saml" || settings.authMode === "oidc") {
      const ssoType = settings.ssoType || (settings.authMode === "saml" ? "saml" : "oidc");
      if (ssoType === "saml" && isSamlConfigured(settings)) {
        return NextResponse.json({ error: "Password login is disabled. Use SAML SSO sign in." }, { status: 403 });
      }
      if (ssoType === "oidc" && isOidcConfigured(settings)) {
        return NextResponse.json({ error: "Password login is disabled. Use OIDC sign in." }, { status: 403 });
      }
    }

    let isValid = false;
    let mustChangePassword = false;

    if (storedHash) {
      isValid = await bcrypt.compare(password, storedHash);
      if (isValid) {
        mustChangePassword = isDefaultPasswordPending(settings);
      }
    } else {
      // Default initial password is '123456'
      const initialPassword = process.env.INITIAL_PASSWORD || DEFAULT_PASSWORD;
      isValid = password === initialPassword || password === DEFAULT_PASSWORD;
      if (isValid) {
        mustChangePassword = true;
      }
    }

    if (isValid) {
      recordSuccess(ip);
      const cookieStore = await cookies();

      if (mustChangePassword) {
        // Issue restricted setup session token: allows only password change endpoint
        await setDashboardAuthCookie(cookieStore, request, {
          setupOnly: true,
          mustChangePassword: true,
        });

        return NextResponse.json(
          {
            success: true,
            mustChangePassword: true,
            message: "Default password in use. Please change your password to continue.",
          },
          { headers: NO_STORE_HEADERS }
        );
      }

      // Normal full-access dashboard token
      await setDashboardAuthCookie(cookieStore, request, {
        setupOnly: false,
        mustChangePassword: false,
        pwt: settings.passwordChangedAt,
      });

      return NextResponse.json({ success: true, mustChangePassword: false }, { headers: NO_STORE_HEADERS });
    }

    const { remainingBeforeLock } = recordFail(ip);
    const postLock = checkLock(ip);

    let errorMsg = "Invalid password";
    if (postLock.locked) {
      errorMsg = `Too many failed attempts. Try again in ${postLock.retryAfter}s.`;
    } else if (remainingBeforeLock <= 2 && remainingBeforeLock > 0) {
      errorMsg = `Invalid password. ${remainingBeforeLock} attempt(s) remaining before temporary lockout.`;
    }

    return NextResponse.json(
      {
        error: errorMsg,
        remaining: remainingBeforeLock,
        locked: postLock.locked,
        retryAfter: postLock.retryAfter || undefined,
        resetHint: RESET_HINT,
      },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    console.error("Login route error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500, headers: NO_STORE_HEADERS });
  }
}
