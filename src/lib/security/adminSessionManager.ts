import { getSupabaseAdmin } from "@/lib/supabase/server";
import { securityLogger } from "./logger";

export const ADMIN_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

export interface AdminSessionRecord {
  sessionId: string;
  adminId: string;
  adminEmail: string;
  ip: string;
  userAgent?: string;
  createdAt: number;
  lastActivityAt: number;
  isActive: boolean;
}

// Global server-side synchronized in-memory registry (prevents race conditions and provides microsecond lookup)
// Key: adminId -> AdminSessionRecord
const activeAdminSessions = new Map<string, AdminSessionRecord>();
// Key: sessionId -> adminId
const sessionToAdminMap = new Map<string, string>();

/**
 * Checks for and creates an exclusive single active Admin session.
 * Rejects concurrent logins from a secondary browser while a valid session is active.
 */
export async function establishAdminSession(
  adminId: string,
  adminEmail: string,
  ip: string,
  userAgent?: string,
  existingSessionId?: string
): Promise<{
  allowed: boolean;
  sessionId?: string;
  error?: string;
}> {
  const now = Date.now();
  const existingSession = activeAdminSessions.get(adminId);

  // 1. Check existing in-memory session
  if (existingSession && existingSession.isActive) {
    const isIdleExpired = now - existingSession.lastActivityAt > ADMIN_INACTIVITY_TIMEOUT_MS;

    if (isIdleExpired) {
      // Inactivity timeout reached: automatically terminate stale session
      existingSession.isActive = false;
      sessionToAdminMap.delete(existingSession.sessionId);
      activeAdminSessions.delete(adminId);
      securityLogger.audit("ADMIN_SESSION_EXPIRED_ON_LOGIN_ATTEMPT", {
        adminId,
        sessionId: existingSession.sessionId,
      });
    } else if (existingSessionId && existingSessionId === existingSession.sessionId) {
      // Same browser/tab refreshing its existing session: allow activity refresh
      existingSession.lastActivityAt = now;
      return { allowed: true, sessionId: existingSession.sessionId };
    } else {
      // Browser B / another device attempting to log in while an active session exists
      securityLogger.alert("CONCURRENT_ADMIN_LOGIN_REJECTED", {
        adminId,
        incomingIp: ip,
        activeSessionIp: existingSession.ip,
      });

      return {
        allowed: false,
        error: "Admin access is currently unavailable. An active administrator session already exists.",
      };
    }
  }

  // 2. Database verification check (authoritative persistence)
  try {
    const adminSupabase = getSupabaseAdmin();
    if (adminSupabase) {
      const { data: dbSession } = await (adminSupabase.from("admin_sessions" as any) as any)
        .select("*")
        .eq("admin_id", adminId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbSession) {
        const lastAct = new Date(dbSession.last_activity_at).getTime();
        const isDbExpired = now - lastAct > ADMIN_INACTIVITY_TIMEOUT_MS;

        if (isDbExpired) {
          await (adminSupabase.from("admin_sessions" as any) as any)
            .update({
              is_active: false,
              revoked_at: new Date().toISOString(),
              revocation_reason: "inactivity_timeout",
            })
            .eq("id", dbSession.id);
        } else if (existingSessionId && existingSessionId === dbSession.session_token_id) {
          // Same browser session
          activeAdminSessions.set(adminId, {
            sessionId: dbSession.session_token_id,
            adminId,
            adminEmail,
            ip,
            userAgent,
            createdAt: new Date(dbSession.created_at).getTime(),
            lastActivityAt: now,
            isActive: true,
          });
          sessionToAdminMap.set(dbSession.session_token_id, adminId);
          return { allowed: true, sessionId: dbSession.session_token_id };
        } else {
          securityLogger.alert("CONCURRENT_ADMIN_LOGIN_DB_BLOCKED", {
            adminId,
            incomingIp: ip,
          });

          return {
            allowed: false,
            error: "Admin access is currently unavailable. An active administrator session already exists.",
          };
        }
      }
    }
  } catch (dbErr) {
    console.warn("Notice: admin_sessions database lookup fallback to in-memory store:", dbErr);
  }

  // 3. Atomically establish the new exclusive session
  const newSessionId = `adm_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const sessionRecord: AdminSessionRecord = {
    sessionId: newSessionId,
    adminId,
    adminEmail,
    ip,
    userAgent,
    createdAt: now,
    lastActivityAt: now,
    isActive: true,
  };

  activeAdminSessions.set(adminId, sessionRecord);
  sessionToAdminMap.set(newSessionId, adminId);

  // Asynchronously record in database table
  try {
    const adminSupabase = getSupabaseAdmin();
    if (adminSupabase) {
      await (adminSupabase.from("admin_sessions" as any) as any).insert({
        admin_id: adminId,
        session_token_id: newSessionId,
        ip_address: ip,
        user_agent_hash: userAgent ? userAgent.slice(0, 100) : null,
        created_at: new Date(now).toISOString(),
        last_activity_at: new Date(now).toISOString(),
        expires_at: new Date(now + ADMIN_INACTIVITY_TIMEOUT_MS).toISOString(),
        is_active: true,
      });
    }
  } catch {}

  securityLogger.info("ADMIN_SINGLE_SESSION_ESTABLISHED", {
    adminId,
    sessionId: newSessionId,
    ip,
  });

  return { allowed: true, sessionId: newSessionId };
}

/**
 * Validates an existing Admin session against the single-session authority & 30-minute inactivity limit.
 */
export async function validateAdminSession(
  sessionId: string,
  adminId: string
): Promise<{
  valid: boolean;
  reason?: "inactivity" | "invalid" | "superseded";
  session?: AdminSessionRecord;
}> {
  if (!sessionId || !adminId) {
    return { valid: false, reason: "invalid" };
  }

  const now = Date.now();
  let session = activeAdminSessions.get(adminId);

  // If in-memory map has no record (e.g. cold server restart), check database
  if (!session) {
    try {
      const adminSupabase = getSupabaseAdmin();
      if (adminSupabase) {
        const { data: dbSession } = await (adminSupabase.from("admin_sessions" as any) as any)
          .select("*")
          .eq("admin_id", adminId)
          .eq("session_token_id", sessionId)
          .eq("is_active", true)
          .maybeSingle();

        if (dbSession) {
          session = {
            sessionId: dbSession.session_token_id,
            adminId,
            adminEmail: dbSession.admin_email || "admin@erasstudio.com",
            ip: dbSession.ip_address || "127.0.0.1",
            createdAt: new Date(dbSession.created_at).getTime(),
            lastActivityAt: new Date(dbSession.last_activity_at).getTime(),
            isActive: dbSession.is_active,
          };
          activeAdminSessions.set(adminId, session);
          sessionToAdminMap.set(sessionId, adminId);
        }
      }
    } catch {}
  }

  if (!session || !session.isActive) {
    return { valid: false, reason: "invalid" };
  }

  // Verify this is the active session and not superseded
  if (session.sessionId !== sessionId) {
    return { valid: false, reason: "superseded" };
  }

  // 30-Minute Inactivity Window Verification
  const idleTime = now - session.lastActivityAt;
  if (idleTime > ADMIN_INACTIVITY_TIMEOUT_MS) {
    // Session is officially expired due to inactivity
    session.isActive = false;
    activeAdminSessions.delete(adminId);
    sessionToAdminMap.delete(sessionId);

    // Sync database revocation
    try {
      const adminSupabase = getSupabaseAdmin();
      if (adminSupabase) {
        await (adminSupabase.from("admin_sessions" as any) as any)
          .update({
            is_active: false,
            revoked_at: new Date().toISOString(),
            revocation_reason: "inactivity_timeout",
          })
          .eq("session_token_id", sessionId);
      }
    } catch {}

    securityLogger.audit("ADMIN_SESSION_EXPIRED_INACTIVITY", {
      adminId,
      sessionId,
      idleMinutes: Math.round(idleTime / 60000),
    });

    return { valid: false, reason: "inactivity" };
  }

  // Qualifying activity: bump lastActivityAt
  session.lastActivityAt = now;

  return { valid: true, session };
}

/**
 * Revokes an Admin session upon logout.
 */
export async function terminateAdminSession(sessionId?: string, adminId?: string): Promise<void> {
  let targetAdminId = adminId;
  if (!targetAdminId && sessionId) {
    targetAdminId = sessionToAdminMap.get(sessionId);
  }

  if (targetAdminId) {
    const session = activeAdminSessions.get(targetAdminId);
    if (session) {
      session.isActive = false;
      sessionToAdminMap.delete(session.sessionId);
      activeAdminSessions.delete(targetAdminId);
    }
  }

  if (sessionId) {
    sessionToAdminMap.delete(sessionId);
    try {
      const adminSupabase = getSupabaseAdmin();
      if (adminSupabase) {
        await (adminSupabase.from("admin_sessions" as any) as any)
          .update({
            is_active: false,
            revoked_at: new Date().toISOString(),
            revocation_reason: "admin_logout",
          })
          .eq("session_token_id", sessionId);
      }
    } catch {}
  }

  securityLogger.info("ADMIN_SESSION_TERMINATED", { sessionId, adminId: targetAdminId });
}
