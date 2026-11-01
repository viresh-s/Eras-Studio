import { getAuthenticatedUser, getAuthenticatedProfile } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AccountSettingsForm from '@/components/features/creator/AccountSettingsForm';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');

  const profile = await getAuthenticatedProfile(user.id);
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
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#141413] tracking-tight">
            Account & Security
          </h1>
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
