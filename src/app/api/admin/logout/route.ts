import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_OPTIONS, verifySessionToken } from "@/lib/auth";
import { terminateAdminSession } from "@/lib/security/adminSessionManager";
import { reportsRepo } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_OPTIONS.name)?.value;
    const session = await verifySessionToken(token);

    if (session) {
      await terminateAdminSession(session.sessionId, session.id);
      await reportsRepo.logAudit({
        adminId: session.id || "adm_01",
        action: "admin_logout" as any,
        note: `Administrator '${session.name}' logged out. Session invalidated.`,
      }).catch(() => {});
    }

    // Delete dedicated admin session cookie
    cookieStore.delete(COOKIE_OPTIONS.name);
    cookieStore.set({
      name: COOKIE_OPTIONS.name,
      value: "",
      httpOnly: COOKIE_OPTIONS.httpOnly,
      secure: COOKIE_OPTIONS.secure,
      sameSite: COOKIE_OPTIONS.sameSite,
      path: COOKIE_OPTIONS.path,
      maxAge: 0,
    });

    // Terminate Supabase Auth session
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {}

    // Clear all Supabase auth token cookies
    cookieStore.getAll().forEach((cookie) => {
      if (cookie.name.startsWith("sb-")) {
        cookieStore.delete(cookie.name);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { error: "Failed to clear session." },
      { status: 500 }
    );
  }
}
