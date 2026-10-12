import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditProfileForm from '@/components/features/creator/EditProfileForm';

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
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-serif font-semibold text-[var(--color-cor-ink)] tracking-tight mb-1">Edit Profile</h1>
        <p className="text-[var(--color-cor-ink-light)] text-sm">Update your public presence and account settings.</p>
      </div>
      <EditProfileForm userProfile={profile} />
    </div>
  );
}
