import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditProfileForm from '@/components/features/creator/EditProfileForm';

export const dynamic = 'force-dynamic';

export default async function EditProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  // If a collector somehow navigates to /profile, redirect them to the correct page
  if (profile.role !== 'Creator' && profile.role !== 'Admin') {
    redirect('/user/profile');
  }

  return (
    <div className="py-2">
      <EditProfileForm userProfile={profile} />
    </div>
  );
}
