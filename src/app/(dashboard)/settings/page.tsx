import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AccountSettingsForm from '@/components/features/creator/AccountSettingsForm';

export default async function SettingsPage() {
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
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-[var(--color-cor-ink)] tracking-tight mb-2">Account Settings</h1>
        <p className="text-[var(--color-cor-ink-light)] text-sm font-medium uppercase tracking-wider">Manage your email, password, and account security</p>
      </div>
      <AccountSettingsForm currentEmail={user.email!} />
    </div>
  );
}
