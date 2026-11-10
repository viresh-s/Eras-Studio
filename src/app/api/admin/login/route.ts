import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyCredentials,
  createSessionToken,
  verifySessionToken,
  COOKIE_OPTIONS,
} from "@/lib/auth";
import { establishAdminSession } from "@/lib/security/adminSessionManager";
import { globalRateLimiter, RATE_LIMIT_CONFIGS } from "@/lib/security/rateLimit";
import { reportsRepo } from "@/lib/data";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = globalRateLimiter.check(
      `login_${clientIp}`,
      RATE_LIMIT_CONFIGS.LOGIN.limit,
      RATE_LIMIT_CONFIGS.LOGIN.windowMs
    );

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Please try again in ${rateLimit.resetSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimit.resetSeconds.toString(),
            "X-RateLimit-Limit": RATE_LIMIT_CONFIGS.LOGIN.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.resetSeconds.toString(),
          },
        }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { username, password } = body || {};

    if (!username || !password || typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Username and password are required." },
        {
          status: 400,
          headers: {
            "X-RateLimit-Limit": RATE_LIMIT_CONFIGS.LOGIN.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          },
        }
      );
    }

    const verification = await verifyCredentials(username, password);

    if (!verification.success || !verification.user) {
      return NextResponse.json(
        { error: verification.error || "Invalid username or password." },
        {
          status: 401,
          headers: {
            "X-RateLimit-Limit": RATE_LIMIT_CONFIGS.LOGIN.limit.toString(),
            "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          },
        }
      );
    }

    // Check single active admin session and 30-minute inactivity
    const cookieStore = await cookies();
    const existingToken = cookieStore.get(COOKIE_OPTIONS.name)?.value;
    let existingSessionId: string | undefined;
    if (existingToken) {
      try {
        const verified = await verifySessionToken(existingToken);
        existingSessionId = verified?.sessionId;
      } catch {}
    }

    const sessionResult = await establishAdminSession(
      verification.user.id || "adm_01",
      verification.user.email,
      clientIp,
      request.headers.get("user-agent") || undefined,
      existingSessionId
    );

    if (!sessionResult.allowed) {
      return NextResponse.json(
        { error: sessionResult.error || "Admin access is currently unavailable. An active administrator session already exists." },
        { status: 409 }
      );
    }

    const token = await createSessionToken({
      id: verification.user.id || "adm_01",
      username: username.trim(),
      role: (verification.user.role as any) || "super_admin",
      name: verification.user.name,
      email: verification.user.email,
      sessionId: sessionResult.sessionId,
    });

    cookieStore.set({
      name: COOKIE_OPTIONS.name,
      value: token,
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite,
      path: COOKIE_OPTIONS.path,
      maxAge: COOKIE_OPTIONS.maxAge,
    });

    // Reset failed login rate limit on successful authentication
    globalRateLimiter.reset(`login_${clientIp}`);

    // Log admin login event into tamper-resistant audit trail (without storing secrets)
    await reportsRepo.logAudit({
      adminId: verification.user.id || "adm_01",
      action: "admin_login" as any,
      note: `Administrator '${verification.user.name}' authenticated successfully from IP ${clientIp}.`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      user: verification.user,
    });
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during authentication." },
      { status: 500 }
    );
  }
}
