'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface UpdateProfileData {
  userId: string;
  full_name: string;
  phone_number?: string | null;
  location_country?: string | null;
  location_city?: string | null;
  about_me?: string | null;
  portfolio_url?: string | null;
  social_links?: Record<string, string> | null;
}

export async function updateProfile(data: UpdateProfileData) {
  const supabase = await createClient();
  
  const { userId, ...updateData } = data;

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/creator/profile');
  revalidatePath('/user/profile');
}

export async function updateProfileAvatar(userId: string, avatarUrl: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('profiles')
    .update({ profile_pic_url: avatarUrl })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function upgradeToPremiumServer(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('profiles')
    .update({ is_premium: true })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
  
  revalidatePath('/creator/upload');
}
