import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { AdminUser } from "./types";
import { AppRole, Permission, hasPermission, isAdminOrModerator } from "./security/rbac";
import { createClient } from "./supabase/server";
import {
  establishAdminSession,
  validateAdminSession,
  terminateAdminSession,
  ADMIN_INACTIVITY_TIMEOUT_MS,
} from "./security/adminSessionManager";
import {
  isAuthorizedAdminEmail,
  isAuthorizedAdminUserId,
  resolveLoginIdentifier,
} from "./security/adminWhitelist";

export const AUTH_COOKIE_NAME = "erasstudio_admin_session";

export const DEFAULT_ADMIN: AdminUser = {
  id: "adm_01",
  name: "Elena Vance",
  email: "elena@erasstudio.com",
  role: "super_admin",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  lastLoginAt: "Active Session",
};

export interface SessionPayload {
  id: string;
  username: string;
  role: AppRole;
  name: string;
  email: string;
  sessionId?: string;
  [key: string]: unknown;
}

export const COOKIE_OPTIONS = {
  name: AUTH_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 30 * 60, // Exactly 30 minutes inactivity timeout
};

/**
 * Encodes the session secret key for HS256 JWT signing and verification.
 * In production, enforces presence of a strong secret (min 32 chars).
 */
function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (process.env.NODE_ENV === "production") {
    if (!secret || secret.length < 32) {
      throw new Error(
        "[SECURITY CRITICAL] SESSION_SECRET environment variable is missing or shorter than 32 characters in production. Aborting session token generation."
      );
    }
    return new TextEncoder().encode(secret);
  }

  // Development fallback with explicit security warning
  if (!secret) {
    console.warn(
      "[SECURITY WARNING] SESSION_SECRET is not set in development. Using dev fallback key. Set SESSION_SECRET in .env.local for production."
    );
  }

  return new TextEncoder().encode(secret || "erasstudio_fallback_session_secret_min_32_chars_long");
}

/**
 * Validates user credentials against Supabase Auth and the Authoritative Predefined Admin Whitelist (Phase 25).
 * Replaces legacy .env username/password comparison with secure Supabase Auth verification.
 */
export async function verifyCredentials(
  identifier: string,
  password: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  const cleanId = identifier?.trim();
  const cleanPass = password?.trim();

  if (!cleanId || !cleanPass) {
    return {
      success: false,
      error: "Username/email and password are required.",
    };
  }

  const authEmail = resolveLoginIdentifier(cleanId);

  // Restrict to predefined admin accounts only
  if (!isAuthorizedAdminEmail(authEmail)) {
    return {
      success: false,
      error: "Invalid credentials or unauthorized administrative identity.",
    };
  }

  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: cleanPass,
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || "Invalid username or password.",
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name, email, status")
      .eq("id", authData.user.id)
      .single();

    if (profile?.status === "suspended") {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Your administrative account is suspended.",
      };
    }

    if (profile?.role !== "Admin") {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Forbidden: Account lacks administrative privileges.",
      };
    }

    return {
      success: true,
      user: {
        id: authData.user.id,
        name: profile?.full_name || authData.user.user_metadata?.full_name || "Administrator",
        email: authData.user.email || authEmail,
        role: "super_admin",
        avatarUrl: DEFAULT_ADMIN.avatarUrl,
        lastLoginAt: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Authentication error occurred.",
    };
  }
}

/**
 * Creates and signs an encrypted/tamper-proof JWT session token with a 30-minute idle limit.
 */
export async function createSessionToken(
  payload: {
    username: string;
    role: AppRole;
    name: string;
    email: string;
    id?: string;
    sessionId?: string;
    [key: string]: unknown;
  }
): Promise<string> {
  const secret = getSessionSecret();
  const sessionId = payload.sessionId || `adm_sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const fullPayload: SessionPayload = {
    id: payload.id || "adm_01",
    username: payload.username,
    role: payload.role,
    name: payload.name,
    email: payload.email,
    sessionId,
  };

  return new SignJWT({ ...fullPayload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m") // Strict 30-minute token expiration
    .sign(secret);
}

/**
 * Verifies a JWT session token and returns the typed payload if valid and unexpired.
 * Validates against the single active session registry and 30-minute inactivity limit.
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const secret = getSessionSecret();
    const { payload } = await jwtVerify(token, secret);
    const sessionPayload = payload as unknown as SessionPayload;

    // Enforce server-side single active session and 30-minute inactivity window
    if (sessionPayload.sessionId && sessionPayload.id) {
      const validation = await validateAdminSession(sessionPayload.sessionId, sessionPayload.id);
      if (!validation.valid) {
        return null;
      }
    }

    return sessionPayload;
  } catch {
    return null;
  }
}

/**
 * Centralized Server-Side Admin Authorization Guard.
 * Checks for dedicated admin JWT session cookie OR Supabase admin user role.
 */
export async function requireAdminSession(requiredPermission?: Permission): Promise<SessionPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  let session = await verifySessionToken(token);

  if (!session) {
    // Check Supabase SSR session
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name, email')
          .eq('id', user.id)
          .single();

        if (profile && profile.role === 'Admin' && isAuthorizedAdminEmail(user.email)) {
          session = {
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'admin',
            role: 'super_admin',
            name: profile.full_name || 'Administrator',
            email: user.email || 'admin@eras.com',
          };
        }
      }
    } catch {}
  }

  if (!session) {
    throw new Error("Your session expired due to inactivity. Please log in again.");
  }

  if (!isAdminOrModerator(session.role)) {
    throw new Error("Forbidden: Admin or Moderator privileges required.");
  }

  if (requiredPermission && !hasPermission(session.role, requiredPermission)) {
    throw new Error(`Forbidden: Missing required permission '${requiredPermission}'.`);
  }

  return session;
}
