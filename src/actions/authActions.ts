'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

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

export async function resendVerificationEmail(emailRaw: string): Promise<{ error?: string, success?: boolean }> {
  const parsed = emailSchema.safeParse(emailRaw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const email = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });

  if (error) return { error: error.message };
  return { success: true };
}
