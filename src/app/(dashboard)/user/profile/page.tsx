import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileEditForm from '@/components/features/shared/ProfileEditForm';

export default async function UserProfilePage() {
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
      <h1 className="font-heading text-3xl font-bold mb-6">My Profile</h1>
      <ProfileEditForm profile={profile} showCreatorFields={false} />
    </div>
  );
}
