import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isProUser } from '@/lib/security/authGuard';
import { CorService } from '@/lib/services/corService';
import CorLockedState from '@/components/features/cor/CorLockedState';
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
import { Calendar, ArrowRight, Sparkles } from 'lucide-react';

export const metadata = {
  title: 'COR PRO Dashboard | ErasStudio®',
  description: 'Human guidance. Thoughtful opportunities. A clearer way forward for artists and creators.',
};

export default async function CorDashboardPage() {
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
  const dashboardData = await service.getDashboardData(user.id);
  const { requestStatus, submittedAt, declinedReason, fullProfile } = dashboardData;

  // Phase 3: Creator has not submitted a COR request
  if (requestStatus === 'NotSubmitted') {
    return (
      <div className="max-w-6xl mx-auto py-4 sm:py-6 animate-in fade-in duration-200">
        <CorIntroSection />
      </div>
    );
  }

  // Phase 10: Request is Pending review by admin
  if (requestStatus === 'Pending') {
    return (
      <div className="max-w-6xl mx-auto py-4 sm:py-6 animate-in fade-in duration-200">
        <CorRequestPending submittedAt={submittedAt} fullProfile={fullProfile} />
      </div>
    );
  }

  // Phase 10: Request was Declined
  if (requestStatus === 'Declined') {
    return (
      <div className="max-w-6xl mx-auto py-4 sm:py-6 animate-in fade-in duration-200">
        <CorRequestDeclined declinedReason={declinedReason} />
      </div>
    );
  }

  // Phase 11: Approved Member Experience
  const existingAppliedOppIds = dashboardData.recentApplications.map((a) => a.opportunity_id);

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <CorPageHeader
        eyebrow="CAREER OPPORTUNITY RESOURCE · MEMBER"
        title="Your next chapter starts here."
        description="Human guidance. Thoughtful opportunities. A clearer way forward."
        actions={
          <Link
            href="/cor/consultations"
            className="px-5 py-2.5 rounded-full bg-[#141413] text-white text-xs font-semibold hover:bg-[#2A2A28] active:bg-black transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Calendar size={14} className="text-[#FAF5EC]" />
            <span>Schedule Consultation</span>
          </Link>
        }
      />

      {/* Hero Section */}
      <CorHeroSection
        profile={dashboardData.profile}
        completeness={dashboardData.fullProfile?.profile.completeness_percentage || 0}
      />

      {/* Metrics Bar */}
      <CorMetricsBar metrics={dashboardData.metrics} />

      {/* Application Pipeline */}
      <CorPipelineGrid counts={dashboardData.pipelineCounts} />

      {/* Main 2-Column Split: Consultations & Activity vs Recommended Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 cols): Consultation & Recent Activity */}
        <div className="lg:col-span-5 space-y-6">
          <CorConsultationCard consultation={dashboardData.upcomingConsultation} />
          <CorRecentActivity activities={dashboardData.recentActivities} />
        </div>

        {/* Right Column (7 cols): Recommended Opportunities */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F0EB]">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#141413]">
                Recommended opportunities
              </h2>
              <p className="text-xs text-[#6E6E69] mt-0.5">
                Curated calls matched against your practice and desired roles.
              </p>
            </div>

            <Link
              href="/cor/opportunities"
              className="text-xs font-semibold text-[#141413] hover:text-black inline-flex items-center gap-1 group transition-colors"
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
              <Sparkles size={24} className="text-[#865E16] mx-auto mb-2" />
              <p className="font-serif text-lg font-semibold text-[#141413]">
                Opportunities in Preparation
              </p>
              <p className="text-xs text-[#6E6E69] mt-1 max-w-sm mx-auto">
                Our curatorial network is actively reviewing new calls for your medium. Check back soon or view the general directory.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
