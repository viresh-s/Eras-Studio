import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { isProUser } from '@/lib/security/authGuard';
import { CorService } from '@/lib/services/corService';
import CorLockedState from '@/components/features/cor/CorLockedState';
import CorPageHeader from '@/components/features/cor/CorPageHeader';
import CorApplicationDetailClient from '@/components/features/cor/CorApplicationDetailClient';
import { ArrowLeft } from 'lucide-react';

interface CorApplicationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CorApplicationDetailPage({ params }: CorApplicationDetailPageProps) {
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

  const applications = await service.getApplications(user.id);
  const application = applications.find((a) => a.id === id);

  if (!application) {
    notFound();
  }

  const events = await service.getApplicationEvents(id, user.id);
  const fullProfile = await service.getFullProfile(user.id);
  const consultantName = fullProfile.profile.assigned_consultant || 'Priya Nair';

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 space-y-6">
      <CorPageHeader
        eyebrow="APPLICATION TIMELINE"
        title={application.opportunity?.role || 'Application Progress'}
        description={`Tracking application at ${application.opportunity?.company || 'Partner Studio'} · Advisor: ${consultantName}`}
        actions={
          <Link
            href="/cor/applications"
            className="text-xs font-semibold text-[#6E6E69] hover:text-[#141413] inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={13} />
            <span>Application Tracker</span>
          </Link>
        }
      />

      <CorApplicationDetailClient
        application={application}
        initialEvents={events}
        consultantName={consultantName}
        candidateProfile={fullProfile}
      />
    </div>
  );
}
