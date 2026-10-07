import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isProUser } from '@/lib/security/authGuard';
import { CorService } from '@/lib/services/corService';
import CorLockedState from '@/components/features/cor/CorLockedState';
import CorPageHeader from '@/components/features/cor/CorPageHeader';
import CorConsultationWorkflow from '@/components/features/cor/CorConsultationWorkflow';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Career Consultations | COR PRO | ErasStudio®',
  description: 'Schedule a 1-on-1 session with the iRAS career team for portfolio reviews, interview preparation, and residency guidance.',
};

export default async function CorConsultationsPage() {
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

  const consultations = await service.getConsultations(user.id);

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 space-y-6">
      <CorPageHeader
        eyebrow="A LITTLE GUIDANCE GOES A LONG WAY"
        title="Career Consultation"
        description="Choose a session with the iRAS career team. All scheduled times are in Indian Standard Time (IST)."
        actions={
          <Link
            href="/cor"
            className="text-xs font-semibold text-[#6E6E69] hover:text-[#141413] inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Dashboard</span>
          </Link>
        }
      />

      <CorConsultationWorkflow initialConsultations={consultations} />
    </div>
  );
}
