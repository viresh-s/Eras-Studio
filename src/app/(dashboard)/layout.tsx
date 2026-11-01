import { redirect } from 'next/navigation';
import { createClient, getAuthenticatedUser, getAuthenticatedProfile } from '@/lib/supabase/server';
import DashboardShell from '@/components/features/dashboard/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');

  const profile = await getAuthenticatedProfile(user.id);

  if (!profile) {
    // If we have a user but no profile in the DB, gracefully sign them out.
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}
