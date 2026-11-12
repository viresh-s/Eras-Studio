import React from 'react';
import Link from 'next/link';
import { createClient, getAuthenticatedUser, getAuthenticatedProfile } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isProUser } from '@/lib/security/authGuard';
import { CorService } from '@/lib/services/corService';
import CorLandingPage from '@/components/features/cor/CorLandingPage';
import CorIntroSection from '@/components/features/cor/CorIntroSection';
import CorRequestPending from '@/components/features/cor/CorRequestPending';
import CorRequestDeclined from '@/components/features/cor/CorRequestDeclined';
import CorPageHeader from '@/components/features/cor/CorPageHeader';
import CorHeroSection from '@/components/features/cor/CorHeroSection';
import CorMetricsBar from '@/components/features/cor/CorMetricsBar';
import CorPipelineGrid from '@/components/features/cor/CorPipelineGrid';
import CorConsultationCard from '@/components/features/cor/CorConsultationCard';
import CorRecentActivity from '@/components/features/cor/CorRecentActivity';
import CorOpportunityCard from '@/components/features/cor/CorOpportunityCard';
import { Calendar, ArrowRight, ArrowUpRight } from 'lucide-react';

export const metadata = {
  title: 'COR — Curatorial Opportunity & Representation | ErasStudio®',
  description: 'Human guidance. Curated institutional opportunities. Professional representation for artists.',
};

interface CorDashboardPageProps {
  searchParams?: Promise<{ view?: string }>;
}

export default async function CorDashboardPage({ searchParams }: CorDashboardPageProps) {
  const params = searchParams ? await searchParams : {};
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');

  const profile = await getAuthenticatedProfile(user.id);
  const isPro = isProUser(profile);

  // If user is Free OR specifically requests the landing page overview
  if (!isPro || params?.view === 'landing' || params?.view === 'overview') {
    return (
      <div className="max-w-6xl mx-auto py-2 sm:py-6 animate-in fade-in duration-300">
        <CorLandingPage
          isPro={isPro}
          profile={profile}
        />
      </div>
    );
  }

  const supabase = await createClient();
  const service = new CorService(supabase);
  const dashboardData = await service.getDashboardData(user.id);
  const { requestStatus, submittedAt, declinedReason, fullProfile } = dashboardData;

  // Creator has not submitted a COR questionnaire: show modern editorial overview
  if (requestStatus === 'NotSubmitted') {
    return (
      <div className="max-w-6xl mx-auto py-2 sm:py-6 animate-in fade-in duration-300">
        <CorLandingPage
          isPro={true}
          profile={profile}
        />
      </div>
    );
  }

  // Request is Pending review by admin
  if (requestStatus === 'Pending') {
    return (
      <div className="max-w-6xl mx-auto py-4 sm:py-6 animate-in fade-in duration-200">
        <CorRequestPending submittedAt={submittedAt} fullProfile={fullProfile} />
      </div>
    );
  }

  // Request was Declined
  if (requestStatus === 'Declined') {
    return (
      <div className="max-w-6xl mx-auto py-4 sm:py-6 animate-in fade-in duration-200">
        <CorRequestDeclined declinedReason={declinedReason} />
      </div>
    );
  }

  // Approved Member Hub Experience
  const existingAppliedOppIds = dashboardData.recentApplications.map((a) => a.opportunity_id);
  const userFirstName = profile?.full_name?.trim() ? profile.full_name.trim().split(' ')[0] : 'Artist';

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 space-y-8 animate-in fade-in duration-200">
      {/* Page Header with Action to toggle Editorial Program Overview */}
      <CorPageHeader
        title={`Welcome back, ${userFirstName}.`}
        description="Your creative career, opportunities and representation in one place."
        hasBorder={false}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/cor?view=overview"
              className="px-4 py-2.5 rounded-full border border-[#E8E8E3] bg-white text-[#141413] text-xs font-medium hover:bg-[#F2F0ED] transition-colors inline-flex items-center gap-1.5 shadow-2xs font-sans"
            >
              <span>Program Overview</span>
              <ArrowUpRight size={13} />
            </Link>
            <Link
              href="/cor/consultations"
              className="px-6 py-2.5 rounded-full bg-[#141413] text-white text-xs font-medium hover:bg-black transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer font-sans"
            >
              <span>Schedule Consultation</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        }
      />

      {/* Hero Section */}
      <CorHeroSection
        profile={dashboardData.profile}
        completeness={dashboardData.fullProfile?.profile.completeness_percentage || 50}
      />

      {/* Metrics Bar */}
      <CorMetricsBar metrics={dashboardData.metrics} />

      {/* Application Pipeline */}
      <CorPipelineGrid counts={dashboardData.pipelineCounts} />

      {/* Career Support: Consultations & Recent Activity Side-by-Side */}
      <div>
        <h3 className="text-xs font-bold text-[#141413] font-sans mb-3">
          Career support
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <CorConsultationCard consultation={dashboardData.upcomingConsultation} />
          <CorRecentActivity activities={dashboardData.recentActivities} />
        </div>
      </div>

      {/* Full Width Recommended Opportunities */}
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
          <div>
            <h2 className="font-sans font-semibold text-xl sm:text-2xl text-[#141413] tracking-tight">
              Recommended opportunities
            </h2>
          </div>

          <Link
            href="/cor/opportunities"
            className="text-xs font-semibold text-[#141413] hover:text-black inline-flex items-center gap-1 group transition-colors font-sans"
          >
            <span>Explore All</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {dashboardData.recentOpportunities && dashboardData.recentOpportunities.length > 0 ? (
          <div className="space-y-4">
            {dashboardData.recentOpportunities.map((opp) => (
              <CorOpportunityCard
                key={opp.id}
                opportunity={opp}
                isApplied={existingAppliedOppIds.includes(opp.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#E8E8E3] p-12 text-center">
            <p className="font-sans text-base font-semibold text-[#141413]">
              Opportunities in Preparation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
