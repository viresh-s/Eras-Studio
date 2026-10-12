import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isProUser } from '@/lib/security/authGuard';
import { CorService } from '@/lib/services/corService';
import CorLockedState from '@/components/features/cor/CorLockedState';
import CorPageHeader from '@/components/features/cor/CorPageHeader';
import CorApplicationTrackerClient from '@/components/features/cor/CorApplicationTrackerClient';
import { ArrowLeft, Plus } from 'lucide-react';

export const metadata = {
  title: 'Application Tracker | COR PRO | ErasStudio®',
  description: 'Your career team manages the progress. You stay in the loop across all application pipeline stages.',
};

export default async function CorApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const isPro = isProUser(profile);

  if (!isPro) {
    return (
      <div className="max-w-6xl mx-auto py-6">
        <CorLockedState />
      </div>
    );
  }

  const service = new CorService(supabase);
  const { requestStatus } = await service.getRequestAndMembership(user.id);

  if (requestStatus !== 'Approved') {
    redirect('/cor');
  }

  const applications = await service.getApplications(user.id);
  const fullProfile = await service.getFullProfile(user.id);
  const consultantName = fullProfile.profile.assigned_consultant || 'Priya Nair';

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 space-y-6">
      <CorPageHeader
        eyebrow="YOUR NEXT CHAPTER"
        title="Application tracker"
        description="Your dedicated career team manages the progress. You stay in the loop at every milestone."
        actions={
          <div className="flex items-center gap-2.5">
            <Link
              href="/cor/opportunities"
              className="px-4 py-2 rounded-full bg-[#141413] text-white text-xs font-semibold hover:bg-[#2A2A28] inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>Explore Opportunities</span>
            </Link>
            <Link
              href="/cor"
              className="text-xs font-semibold text-[#6E6E69] hover:text-[#141413] inline-flex items-center gap-1 transition-colors px-2 py-1"
            >
              <ArrowLeft size={13} />
              <span>Dashboard</span>
            </Link>
          </div>
        }
      />

      <CorApplicationTrackerClient
        initialApplications={applications}
        consultantName={consultantName}
      />
    </div>
  );
}
