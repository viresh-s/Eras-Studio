import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isProUser } from '@/lib/security/authGuard';
import { CorService } from '@/lib/services/corService';
import CorLockedState from '@/components/features/cor/CorLockedState';
import CorPageHeader from '@/components/features/cor/CorPageHeader';
import CorProfileWorkflow from '@/components/features/cor/CorProfileWorkflow';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Career Profile Questionnaire | COR PRO | ErasStudio®',
  description: 'Complete your 8-step COR Career Profile for institutional curatorial reviews and residency matching.',
};

export default async function CorProfilePage() {
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
  const fullProfile = await service.getFullProfile(user.id);

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 space-y-6">
      <CorPageHeader
        eyebrow="CAREER OPPORTUNITY RESOURCE"
        title="Let’s get to know your ambition."
        description="Your dedicated career team starts here. Your progress is saved automatically across each section."
        actions={
          <Link
            href="/cor"
            className="text-xs font-semibold text-[#6E6E69] hover:text-[#141413] inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Back to Dashboard</span>
          </Link>
        }
      />

      <CorProfileWorkflow initialProfile={fullProfile} />
    </div>
  );
}
