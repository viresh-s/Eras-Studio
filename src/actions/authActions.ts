'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface AuthResult {
  error?: string;
  role?: string;
  requireEmailVerification?: boolean;
}

export async function login(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

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
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const phoneNumber = formData.get('phoneNumber') as string;
  const role = formData.get('role') as string;

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone_number: phoneNumber,
        role: role || 'User',
      },
    },
  });

  if (error) {
    return { error: error.message };
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

export async function resendVerificationEmail(email: string): Promise<{ error?: string, success?: boolean }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) return { error: error.message };
  return { success: true };
}
