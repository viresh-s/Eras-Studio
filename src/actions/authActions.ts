'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface AuthResult {
  error?: string;
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'Creator') {
    redirect('/creator');
  } else if (profile?.role === 'Admin') {
    redirect('/admin');
  } else {
    redirect('/user');
  }
}

export async function signup(formData: FormData): Promise<AuthResult> {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const phoneNumber = formData.get('phoneNumber') as string;
  const role = formData.get('role') as string;

  const { error } = await supabase.auth.signUp({
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

  if (role === 'Creator') {
    redirect('/creator');
  } else {
    redirect('/user');
  }
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
