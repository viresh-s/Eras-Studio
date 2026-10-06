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
    <div>
      <div className="mb-10">
        <h1 className="text-5xl text-gray-900 mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic' }}>
          Your Profile
        </h1>
        <p className="text-gray-500 text-sm">The person and the practice behind the work</p>
      </div>

      <CollectorProfileForm profile={profile} email={user.email || ''} />
    </div>
  );
}
