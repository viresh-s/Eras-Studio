import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AccountSettingsForm from '@/components/features/creator/AccountSettingsForm';
import Link from 'next/link';
import { ShieldCheck, ChevronRight } from 'lucide-react';

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-200">
      {/* Editorial Page Header */}
      <div className="border-b border-[#E8E8E3] pb-6">
        <div className="flex items-center gap-2 text-xs font-medium text-[#8A8A85] mb-2">
          <Link href="/discovery" className="hover:text-[#141413] transition-colors">
            Studio
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#141413]">Account Settings</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#141413] tracking-tight">
              Account & Security
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#6E6E69] max-w-2xl leading-relaxed">
              Manage your credentials, authentication preferences, and security settings across Eras Studio.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E8E8E3] text-xs font-medium text-[#141413] shadow-2xs self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-[#28633B]" />
            <span>Account Protected</span>
          </div>
        </div>
      </div>

      <AccountSettingsForm
        currentEmail={user.email!}
        userProfile={profile}
        userCreatedAt={user.created_at || profile.created_at}
      />
    </div>
  );
}
