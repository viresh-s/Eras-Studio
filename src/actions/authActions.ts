'use server';

import { createClient, getSupabaseAdmin } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';

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
  email: z.string().email('Invalid email address').max(255),
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
  requireEmailVerification?: boolean;
}

export async function login(formData: FormData): Promise<AuthResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password')
  });

  if (!parsed.success) {
    return { error: `Validation Error: ${parsed.error.errors[0].message}` };
  }
  const { email, password } = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Get user profile for role-based redirect
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication failed' };

  let { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // If the database trigger failed and they have no profile, create it now!
  // Since they are logging in, they have a valid session so RLS will allow this.
  if (!profile) {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || 'New User',
        email: user.email!,
        phone_number: user.user_metadata?.phone_number || '',
        role: user.user_metadata?.role || 'User'
      })
      .select('role')
      .single();

    if (newProfile) {
      profile = newProfile;
    } else {
      console.warn("Failed to create fallback profile on login:", insertError);
    }
  }

  return { role: profile?.role || 'User' };
}

export async function signup(formData: FormData): Promise<AuthResult> {
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
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function resendVerificationEmail(emailRaw: string): Promise<{ error?: string, success?: boolean }> {
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
