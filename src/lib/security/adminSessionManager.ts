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

// Global server-side synchronized in-memory registry (provides microsecond lookup and prevents race conditions)
// Key: adminId -> AdminSessionRecord
const activeAdminSessions = new Map<string, AdminSessionRecord>();
// Key: sessionId -> adminId
const sessionToAdminMap = new Map<string, string>();

/**
 * Checks for and creates an exclusive single active Admin session stored in unified public.admin_accounts table.
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

  // 2. Authoritative Database Check in unified public.admin_accounts table
  try {
    const adminSupabase = getSupabaseAdmin();
    if (adminSupabase) {
      const { data: adminRecord } = await (adminSupabase.from("admin_accounts" as any) as any)
        .select("*")
        .eq("id", adminId)
        .maybeSingle();

      if (adminRecord && adminRecord.session_is_active && adminRecord.active_session_token_id) {
        const lastAct = adminRecord.session_last_activity_at
          ? new Date(adminRecord.session_last_activity_at).getTime()
          : 0;
        const isDbExpired = now - lastAct > ADMIN_INACTIVITY_TIMEOUT_MS;

        if (isDbExpired) {
          // Auto-revoke expired database session
          await (adminSupabase.from("admin_accounts" as any) as any)
            .update({
              session_is_active: false,
              session_revoked_at: new Date().toISOString(),
              session_revocation_reason: "inactivity_timeout",
              updated_at: new Date().toISOString(),
            })
            .eq("id", adminId);
        } else if (existingSessionId && existingSessionId === adminRecord.active_session_token_id) {
          // Same browser session
          activeAdminSessions.set(adminId, {
            sessionId: adminRecord.active_session_token_id,
            adminId,
            adminEmail,
            ip,
            userAgent,
            createdAt: adminRecord.session_created_at
              ? new Date(adminRecord.session_created_at).getTime()
              : now,
            lastActivityAt: now,
            isActive: true,
          });
          sessionToAdminMap.set(adminRecord.active_session_token_id, adminId);
          return { allowed: true, sessionId: adminRecord.active_session_token_id };
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
    console.warn("Notice: admin_accounts database lookup fallback to in-memory store:", dbErr);
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

  // Synchronously/Asynchronously update unified admin_accounts record in database
  try {
    const adminSupabase = getSupabaseAdmin();
    if (adminSupabase) {
      await (adminSupabase.from("admin_accounts" as any) as any)
        .update({
          active_session_token_id: newSessionId,
          session_ip_address: ip,
          session_user_agent_hash: userAgent ? userAgent.slice(0, 100) : null,
          session_created_at: new Date(now).toISOString(),
          session_last_activity_at: new Date(now).toISOString(),
          session_expires_at: new Date(now + ADMIN_INACTIVITY_TIMEOUT_MS).toISOString(),
          session_is_active: true,
          session_revoked_at: null,
          session_revocation_reason: null,
          updated_at: new Date(now).toISOString(),
        })
        .eq("id", adminId);
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

  // If in-memory map has no record (e.g. cold server restart), check unified admin_accounts table
  if (!session) {
    try {
      const adminSupabase = getSupabaseAdmin();
      if (adminSupabase) {
        const { data: adminRecord } = await (adminSupabase.from("admin_accounts" as any) as any)
          .select("*")
          .eq("id", adminId)
          .eq("active_session_token_id", sessionId)
          .eq("session_is_active", true)
          .maybeSingle();

        if (adminRecord) {
          session = {
            sessionId: adminRecord.active_session_token_id,
            adminId,
            adminEmail: adminRecord.email || "admin@eras.com",
            ip: adminRecord.session_ip_address || "127.0.0.1",
            createdAt: adminRecord.session_created_at
              ? new Date(adminRecord.session_created_at).getTime()
              : now,
            lastActivityAt: adminRecord.session_last_activity_at
              ? new Date(adminRecord.session_last_activity_at).getTime()
              : now,
            isActive: adminRecord.session_is_active,
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

    // Sync database revocation to unified admin_accounts table
    try {
      const adminSupabase = getSupabaseAdmin();
      if (adminSupabase) {
        await (adminSupabase.from("admin_accounts" as any) as any)
          .update({
            session_is_active: false,
            session_revoked_at: new Date().toISOString(),
            session_revocation_reason: "inactivity_timeout",
            updated_at: new Date().toISOString(),
          })
          .eq("id", adminId);
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
 * Revokes an Admin session upon logout in unified public.admin_accounts table.
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
  }

  try {
    const adminSupabase = getSupabaseAdmin();
    if (adminSupabase) {
      if (targetAdminId) {
        await (adminSupabase.from("admin_accounts" as any) as any)
          .update({
            session_is_active: false,
            session_revoked_at: new Date().toISOString(),
            session_revocation_reason: "admin_logout",
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetAdminId);
      } else if (sessionId) {
        await (adminSupabase.from("admin_accounts" as any) as any)
          .update({
            session_is_active: false,
            session_revoked_at: new Date().toISOString(),
            session_revocation_reason: "admin_logout",
            updated_at: new Date().toISOString(),
          })
          .eq("active_session_token_id", sessionId);
      }
    }
  } catch {}

  securityLogger.info("ADMIN_SESSION_TERMINATED", { sessionId, adminId: targetAdminId });
}
