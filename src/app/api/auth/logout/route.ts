import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { terminateAdminSession } from '@/lib/security/adminSessionManager';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      try {
        const verified = await verifySessionToken(token);
        if (verified) {
          await terminateAdminSession(verified.sessionId, verified.id);
        }
      } catch {}
      cookieStore.delete(AUTH_COOKIE_NAME);
    }

    const supabase = await createClient();
    await supabase.auth.signOut();

    cookieStore.getAll().forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        cookieStore.delete(cookie.name);
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ success: false, error: 'Sign out failed' }, { status: 500 });
  }
}

