import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardShell from '@/components/features/dashboard/DashboardShell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, profile_pic_url, role')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error("DashboardLayout Profile Fetch Error:", JSON.stringify(profileError, null, 2));
  }

  if (!profile) {
    // If we have a user but no profile in the DB, it could mean the trigger failed.
    // Instead of infinite redirecting to /login, let's just sign them out.
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}
