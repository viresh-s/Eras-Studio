import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditProfileForm from '@/components/features/creator/EditProfileForm';
import AccountSettingsForm from '@/components/features/creator/AccountSettingsForm';

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-1">Edit Profile</h1>
        <p className="text-gray-500 text-sm">Update your public presence and account settings.</p>
      </div>
      <EditProfileForm userProfile={profile} />
      <div className="mt-8">
        <AccountSettingsForm currentEmail={user.email!} />
      </div>
    </div>
  );
}
