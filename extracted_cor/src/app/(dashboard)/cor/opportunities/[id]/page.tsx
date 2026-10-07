import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { isProUser } from '@/lib/security/authGuard';
import { CorService } from '@/lib/services/corService';
import CorLockedState from '@/components/features/cor/CorLockedState';
import CorPageHeader from '@/components/features/cor/CorPageHeader';
import CorOpportunityDetailClient from '@/components/features/cor/CorOpportunityDetailClient';
import { ArrowLeft } from 'lucide-react';

interface CorOpportunityPageProps {
  params: Promise<{ id: string }>;
}

export default async function CorOpportunityDetailPage({ params }: CorOpportunityPageProps) {
  const { id } = await params;
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

  const opportunity = await service.getOpportunityById(id, user.id);

  if (!opportunity) {
    notFound();
  }

  const applications = await service.getApplications(user.id);
  const existingApp = applications.find((a) => a.opportunity_id === id) || null;

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 space-y-6">
      <CorPageHeader
        eyebrow="OPPORTUNITY DETAILS"
        title={opportunity.role}
        description={`Curated submission for ${opportunity.company} · ${opportunity.location}`}
        actions={
          <Link
            href="/cor/opportunities"
            className="text-xs font-semibold text-[#6E6E69] hover:text-[#141413] inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>All Opportunities</span>
          </Link>
        }
      />

      <CorOpportunityDetailClient
        opportunity={opportunity}
        existingApplication={existingApp}
      />
    </div>
  );
}
