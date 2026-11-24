'use server';

import { createClient, getSupabaseAdmin } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { z } from 'zod';
import { getClientIp } from '@/lib/security/authGuard';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { securityLogger } from '@/lib/security/logger';
import {
  verifyCredentials,
  createSessionToken,
  verifySessionToken,
  AUTH_COOKIE_NAME,
  COOKIE_OPTIONS,
} from '@/lib/auth';
import {
  establishAdminSession,
  terminateAdminSession,
} from '@/lib/security/adminSessionManager';
import {
  resolveLoginIdentifier,
  isAuthorizedAdminEmail,
  isAuthorizedAdminUserId,
} from '@/lib/security/adminWhitelist';

async function getRequestOrigin(): Promise<string> {
  try {
    const headerList = await headers();
    const host = headerList.get('host') || 'localhost:3000';
    const proto = headerList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  } catch {
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  }
}

const loginSchema = z.object({
  email: z.string().min(1, 'Please enter your email or username').max(255),
  password: z.string().min(1, 'Password is required').max(100)
});

const signupSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  fullName: z.string().min(1, 'Full name is required').max(100),
  phoneNumber: z.string().max(20).optional(),
  role: z.enum(['Creator', 'Collector', 'User']).default('User')
});

const emailSchema = z.string().email('Invalid email address').max(255);

export interface AuthResult {
  error?: string;
  role?: string;
  redirectUrl?: string;
  requireEmailVerification?: boolean;
}

export async function login(formData: FormData): Promise<AuthResult> {
  const ip = await getClientIp();

  // Rate Limiting by IP: 20 login attempts per minute
  const ipRate = checkRateLimit(`login:ip:${ip}`, { maxRequests: 20, windowSeconds: 60 });
  if (!ipRate.allowed) {
    securityLogger.alert('RATE_LIMIT_LOGIN_IP', { ip });
    return { error: 'Too many login attempts from this network. Please wait a minute.' };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  if (!parsed.success) {
    return { error: `Validation Error: ${parsed.error.errors[0].message}` };
  }
  const { email: rawIdentifier, password } = parsed.data;
  const resolvedAuthEmail = resolveLoginIdentifier(rawIdentifier);

  // Rate Limiting by Account: 5 failed attempts per 5 minutes to prevent brute-force attacks
  const emailRate = checkRateLimit(`login:account:${resolvedAuthEmail.toLowerCase()}`, { maxRequests: 5, windowSeconds: 300 });
  if (!emailRate.allowed) {
    securityLogger.alert('RATE_LIMIT_LOGIN_ACCOUNT', { email: resolvedAuthEmail, ip });
    return { error: 'Too many attempts for this account. Please wait 5 minutes before trying again.' };
  }

  // Unified Supabase Authentication
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: resolvedAuthEmail,
    password,
  });

  if (error || !authData.user) {
    securityLogger.audit('LOGIN_FAILED', { email: resolvedAuthEmail, ip, reason: error?.message });
    return { error: error?.message || 'Invalid username or password.' };
  }

  const user = authData.user;

  // Get user profile for role-based redirect & account suspension verification
  let { data: profile } = await supabase
    .from('profiles')
    .select('role, status, full_name')
    .eq('id', user.id)
    .single();

  // Account suspension check: reject suspended users immediately and sign them out
  if (profile?.status === 'suspended') {
    securityLogger.alert('SUSPENDED_USER_LOGIN_BLOCKED', { userId: user.id, email: user.email || resolvedAuthEmail, ip });
    await supabase.auth.signOut();
    return { error: 'Your account is suspended. Please contact studio support for assistance.' };
  }

  // If the database trigger failed and they have no profile, create it now!
  if (!profile) {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || 'New User',
        email: user.email!,
        phone_number: user.user_metadata?.phone_number || '',
        role: user.user_metadata?.role || 'User',
        status: 'active'
      })
      .select('role, status, full_name')
      .single();

    if (newProfile) {
      profile = newProfile;
    } else {
      console.warn("Failed to create fallback profile on login:", insertError);
    }
  }

  securityLogger.info('USER_LOGIN_SUCCESS', { userId: user.id, email: user.email || resolvedAuthEmail, role: profile?.role });

  // 3. Authoritative Role-Based Routing & Single Session Enforcement
  if (profile?.role === 'Admin') {
    // Phase 25: Strict Whitelist - Only the two predefined admin accounts are permitted
    if (!isAuthorizedAdminEmail(user.email) || !isAuthorizedAdminUserId(user.id)) {
      securityLogger.alert('UNAUTHORIZED_ADMIN_ROLE_LOGIN_BLOCKED', {
        userId: user.id,
        email: user.email,
        ip,
      });
      await supabase.auth.signOut();
      return {
        error: "Access denied. Unauthorized administrative identity.",
      };
    }

    const cookieStore = await cookies();
    const existingToken = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    let existingSessionId: string | undefined;
    if (existingToken) {
      try {
        const verified = await verifySessionToken(existingToken);
        existingSessionId = verified?.sessionId;
      } catch {}
    }

    const sessionResult = await establishAdminSession(
      user.id,
      user.email || resolvedAuthEmail,
      ip,
      undefined,
      existingSessionId
    );

    if (!sessionResult.allowed) {
      await supabase.auth.signOut();
      return {
        error: sessionResult.error || "Admin access is currently unavailable. An active administrator session already exists.",
      };
    }

    const token = await createSessionToken({
      id: user.id,
      username: user.user_metadata?.username || (user.email || resolvedAuthEmail).split('@')[0],
      role: 'super_admin',
      name: profile.full_name || 'Administrator',
      email: user.email || resolvedAuthEmail,
      sessionId: sessionResult.sessionId,
    });

    cookieStore.set(AUTH_COOKIE_NAME, token, COOKIE_OPTIONS);
    securityLogger.info('ADMIN_LOGIN_SUCCESS', { adminId: user.id, ip });
    return { role: 'Admin', redirectUrl: '/admin/overview' };
  }

  if (profile?.role === 'Creator') {
    return { role: 'Creator', redirectUrl: '/portfolio' };
  }

  return { role: profile?.role || 'User', redirectUrl: '/discovery' };
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const ip = await getClientIp();

  // Rate Limiting by IP: 5 registration attempts per 10 minutes
  const ipRate = checkRateLimit(`signup:ip:${ip}`, { maxRequests: 5, windowSeconds: 600 });
  if (!ipRate.allowed) {
    securityLogger.alert('RATE_LIMIT_SIGNUP_IP', { ip });
    return { error: 'Too many registration requests. Please wait a few minutes before trying again.' };
  }
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    fullName: formData.get('fullName'),
    phoneNumber: formData.get('phoneNumber') || undefined,
    role: formData.get('role')
  });

  if (!parsed.success) {
    return { error: `Validation Error: ${parsed.error.errors[0].message}` };
  }
  const { email, password, fullName, phoneNumber, role } = parsed.data;

  const supabase = await createClient();
  const origin = await getRequestOrigin();

  // 1. Pre-check if an account with this email already exists in the profiles database
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', email.trim())
    .maybeSingle();

  if (existingProfile) {
    return { error: 'This email is already in use. Please sign in or reset your password.' };
  }

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/login?verified=true`,
      data: {
        full_name: fullName,
        phone_number: phoneNumber,
        role: role || 'User',
      },
    },
  });

  if (error) {
    const errorMsg = error.message.toLowerCase();
    if (errorMsg.includes('already registered') || errorMsg.includes('already exists') || error.status === 422) {
      return { error: 'This email is already in use. Please sign in or reset your password.' };
    }
    return { error: error.message };
  }

  // 2. Check Supabase identities: when email enumeration protection is ON,
  // Supabase returns an empty identities array [] if the email already belongs to an existing user.
  if (authData.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
    return { error: 'This email is already in use. Please sign in or reset your password.' };
  }

  if (authData.user) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName || '',
        email: email,
        phone_number: phoneNumber || '',
        role: role || 'User'
      });
    
    // Ignore duplicate key errors if the trigger actually worked
    if (insertError && insertError.code !== '23505') {
      console.warn('Fallback profile insert failed:', insertError);
    }
  }

  // If email confirmation is enabled in Supabase, the session will be null
  if (!authData.session) {
    return { role: role || 'User', requireEmailVerification: true };
  }

  return { role: role || 'User' };
}

export async function logout(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      const verified = await verifySessionToken(token);
      if (verified) {
        await terminateAdminSession(verified.sessionId, verified.id);
      }
      cookieStore.delete(AUTH_COOKIE_NAME);
    }
  } catch {}

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function resendVerificationEmail(emailRaw: string): Promise<{ error?: string, success?: boolean }> {
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(`resend_verification:${ip}`, { maxRequests: 3, windowSeconds: 900 });
  if (!rateLimit.allowed) {
    return { error: 'Too many verification email requests. Please wait a few minutes before trying again.' };
  }

  const parsed = emailSchema.safeParse(emailRaw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const email = parsed.data;

  const supabase = await createClient();
  const origin = await getRequestOrigin();

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/login?verified=true`,
    },
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function sendPasswordResetOtp(emailRaw: string): Promise<{ error?: string, success?: boolean }> {
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(`password_reset:${ip}`, { maxRequests: 3, windowSeconds: 900 });
  if (!rateLimit.allowed) {
    return { error: 'Too many password reset requests. Please wait a few minutes before trying again.' };
  }

  const parsed = emailSchema.safeParse(emailRaw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const email = parsed.data;

  const supabase = await createClient();
  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/forgot-password?mode=reset`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateUserPassword(newPassword: string): Promise<{ error?: string, success?: boolean }> {
  const ip = await getClientIp();
  const rateLimit = checkRateLimit(`password_update:${ip}`, { maxRequests: 5, windowSeconds: 600 });
  if (!rateLimit.allowed) {
    return { error: 'Too many password update attempts. Please wait.' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'Auth session missing! Please verify via your email link or enter your verification code.' };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) return { error: error.message };
  securityLogger.info('PASSWORD_UPDATED', { userId: user.id });
  return { success: true };
}

const changeEmailSchema = z.object({
  oldEmail: z.string().email('Invalid current email address'),
  newEmail: z.string().email('Invalid new email address'),
});

export async function changeVerificationEmail(
  oldEmailRaw: string,
  newEmailRaw: string
): Promise<{ error?: string; success?: boolean; newEmail?: string }> {
  const parsed = changeEmailSchema.safeParse({
    oldEmail: oldEmailRaw?.trim(),
    newEmail: newEmailRaw?.trim(),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { oldEmail, newEmail } = parsed.data;

  if (oldEmail.toLowerCase() === newEmail.toLowerCase()) {
    return { error: 'The new email address cannot be the same as the current email address.' };
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return { error: 'Server configuration error. Please try again later.' };
  }

  // 1. Verify that newEmail is not already in use
  const { data: existingTarget } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .ilike('email', newEmail)
    .maybeSingle();

  if (existingTarget) {
    return { error: 'This new email address is already in use by another account.' };
  }

  // 2. Locate the existing user by oldEmail
  const { data: oldProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, role')
    .ilike('email', oldEmail)
    .maybeSingle();

  let targetUserId = oldProfile?.id;

  if (!targetUserId) {
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (!listError && usersData?.users) {
      const matched = usersData.users.find(
        (u) => u.email?.toLowerCase() === oldEmail.toLowerCase()
      );
      if (matched) {
        targetUserId = matched.id;
      }
    }
  }

  if (!targetUserId) {
    return {
      error: 'Account not found for that email address. Please proceed to sign up with your correct email.',
    };
  }

  // 3. Check if the user is already confirmed
  const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
  if (getUserError || !userData?.user) {
    return { error: 'Unable to locate user credentials.' };
  }

  if (userData.user.email_confirmed_at) {
    return { error: 'This account is already verified. Please log in directly.' };
  }

  // 4. Update the user email in Supabase Auth
  const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
    email: newEmail,
    email_confirm: false,
  });

  if (updateAuthError) {
    return { error: updateAuthError.message };
  }

  // 5. Update the profiles table
  await supabaseAdmin
    .from('profiles')
    .update({ email: newEmail })
    .eq('id', targetUserId);

  // 6. Send a new verification email to newEmail
  const supabase = await createClient();
  const origin = await getRequestOrigin();

  const { error: resendError } = await supabase.auth.resend({
    type: 'signup',
    email: newEmail,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/login?verified=true`,
    },
  });

  if (resendError) {
    console.warn('Notice while sending verification to updated email:', resendError);
  }

  return { success: true, newEmail };
}
