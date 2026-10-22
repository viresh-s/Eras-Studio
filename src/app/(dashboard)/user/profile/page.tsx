import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CollectorProfileForm from '@/components/features/collector/CollectorProfileForm';

export const dynamic = 'force-dynamic';

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
    <div className="py-2">
      <CollectorProfileForm profile={profile} email={user.email || ''} />
    </div>
  );
}
