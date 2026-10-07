import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isProUser } from '@/lib/security/authGuard';
import { CorService } from '@/lib/services/corService';
import CorLockedState from '@/components/features/cor/CorLockedState';
import CorPageHeader from '@/components/features/cor/CorPageHeader';
import CorOpportunitiesDirectory from '@/components/features/cor/CorOpportunitiesDirectory';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Curated Opportunities | COR PRO | ErasStudio®',
  description: 'Discover curated institutional calls, residencies, and commissions tailored to your creative profile.',
};

export default async function CorOpportunitiesPage() {
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

  const opportunities = await service.getOpportunities(user.id);
  const applications = await service.getApplications(user.id);
  const appliedIds = applications.map((a) => a.opportunity_id);

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 space-y-6">
      <CorPageHeader
        eyebrow="CURATED OPPORTUNITIES"
        title="Institutional calls & residencies"
        description="Matched opportunities evaluated transparently against your artistic medium, practice level, and stated career goals."
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

      <CorOpportunitiesDirectory
        initialOpportunities={opportunities}
        existingAppliedIds={appliedIds}
      />
    </div>
  );
}
