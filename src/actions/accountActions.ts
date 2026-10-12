'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address').max(255);
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(100);

export async function changeEmail(formData: FormData) {
  const emailRaw = formData.get('email');
  const parsed = emailSchema.safeParse(emailRaw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const email = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ email });
  if (error) {
    return { error: error.message };
  }

  return { success: 'Check your new email for a confirmation link.' };
}

export async function changePassword(formData: FormData) {
  const passwordRaw = formData.get('password');
  const parsed = passwordSchema.safeParse(passwordRaw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const password = parsed.data;

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  return { success: 'Password updated successfully!' };
}

export async function deleteAccount(formData: FormData) {
  const passwordRaw = formData.get('password');
  const parsed = passwordSchema.safeParse(passwordRaw);
  if (!parsed.success) return { error: parsed.error.errors[0].message };
  const password = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: 'Not authenticated' };
  }

  // Verify password first by trying to sign in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: password
  });

  if (signInError) {
    return { error: 'Incorrect password.' };
  }

  // If password is correct, call the RPC to delete the user
  const { error: deleteError } = await supabase.rpc('delete_user_account');

  if (deleteError) {
    return { error: 'Failed to delete account. Make sure you ran the SQL script.' };
  }

  await supabase.auth.signOut();
  redirect('/login?deleted=true');
}
