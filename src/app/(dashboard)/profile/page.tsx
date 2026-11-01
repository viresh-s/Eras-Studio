import { getAuthenticatedUser, getAuthenticatedProfile } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EditProfileForm from '@/components/features/creator/EditProfileForm';

export const dynamic = 'force-dynamic';

export default async function EditProfilePage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');

  const profile = await getAuthenticatedProfile(user.id);
  if (!profile) redirect('/login');

  // If a collector somehow navigates to /profile, redirect them to the correct page
  if (profile.role !== 'Creator' && profile.role !== 'Admin') {
    redirect('/user/profile');
  }

  const userProfile = {
    ...profile,
    email: profile.email || user.email || '',
  };

  return (
    <div className="py-2">
      <EditProfileForm userProfile={userProfile} />
    </div>
  );
}
