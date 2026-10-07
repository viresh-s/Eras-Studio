'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building,
  MapPin,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
  Mail,
} from 'lucide-react';
import type { CorOpportunity, CorApplication } from '@/types/cor';

interface CorOpportunityDetailClientProps {
  opportunity: CorOpportunity;
  existingApplication?: CorApplication | null;
}

export default function CorOpportunityDetailClient({
  opportunity,
  existingApplication,
}: CorOpportunityDetailClientProps) {

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Opportunity Description & Specifications */}
        <div className="lg:col-span-8 bg-white border border-[#E8E8E3] rounded-3xl p-7 sm:p-9 shadow-xs space-y-6">
          {/* Header */}
          <div className="border-b border-[#F0F0EB] pb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#141413] text-[#FAF5EC]">
                <Sparkles size={12} className="text-[#FBBF24]" />
                <span>{opportunity.workplace_type}</span>
              </span>

              {opportunity.match_reasons?.map((reason, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FAF5EC] text-[#865E16] border border-[#EADFCF]"
                >
                  {reason}
                </span>
              ))}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#141413] tracking-tight">
              {opportunity.role}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-[#6E6E69] pt-1">
              <span className="flex items-center gap-1.5 font-medium text-[#141413]">
                <Building size={15} className="text-[#8A8A85]" />
                {opportunity.company}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={15} className="text-[#8A8A85]" />
                {opportunity.location}
              </span>
              <span className="font-semibold text-[#141413]">
                {opportunity.salary_range}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-semibold text-[#141413]">
              About the Opportunity
            </h3>
            <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed whitespace-pre-line font-normal">
              {opportunity.description}
            </p>
          </div>

          {/* Requirements & Criteria */}
          {opportunity.requirements && (
            <div className="space-y-3 pt-3 border-t border-[#F0F0EB]">
              <h3 className="font-serif text-lg font-semibold text-[#141413]">
                Requirements & Selection Criteria
              </h3>
              <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed whitespace-pre-line font-normal">
                {opportunity.requirements}
              </p>
            </div>
          )}

          {/* Required Skills & Practice Areas */}
          {opportunity.skills && opportunity.skills.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-[#F0F0EB]">
              <h3 className="font-serif text-lg font-semibold text-[#141413]">
                Desired Skills & Mediums
              </h3>
              <div className="flex flex-wrap gap-2">
                {opportunity.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-[#FAF9F6] border border-[#E8E8E3] text-xs font-medium text-[#5A5A55]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact or External Link */}
          {(opportunity.external_url || opportunity.recruiter_contact) && (
            <div className="pt-4 border-t border-[#F0F0EB] flex flex-wrap items-center gap-4 text-xs text-[#6E6E69]">
              {opportunity.external_url && (
                <a
                  href={opportunity.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-[#141413] hover:underline"
                >
                  <span>Official Open Call Website</span>
                  <ExternalLink size={12} />
                </a>
              )}
              {opportunity.recruiter_contact && (
                <span className="flex items-center gap-1.5">
                  <Mail size={12} />
                  <span>Curator: {opportunity.recruiter_contact}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Application Actions & Pipeline Status */}
        <div className="lg:col-span-4 bg-[#FAF9F6] border border-[#E8E8E3] rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-[#E8E8E3] pb-4">
            <h3 className="font-serif text-xl font-semibold text-[#141413]">
              Application Status
            </h3>
            <p className="text-xs text-[#6E6E69] mt-0.5">
              Curator-assisted application management.
            </p>
          </div>

          {existingApplication ? (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-[#E8E8E3] rounded-2xl space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF2EC] text-[#28633B] border border-[#CCE2D2]">
                  <CheckCircle2 size={13} />
                  <span>Applied by COR Team</span>
                </span>
                <p className="text-xs text-[#141413] font-semibold pt-1">
                  Current Stage: {existingApplication.current_stage}
                </p>
                <p className="text-xs text-[#6E6E69] leading-relaxed">
                  The COR team has initiated an application on your behalf. Track live updates in your timeline.
                </p>
              </div>

              <Link
                href={`/cor/applications/${existingApplication.id}`}
                className="w-full py-3 px-4 rounded-full bg-[#141413] text-white text-xs font-semibold hover:bg-[#2A2A28] transition-colors inline-flex items-center justify-center gap-2"
              >
                <span>View Application & Timeline</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-[#E8E8E3] rounded-2xl space-y-2.5">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-[#865E16]">
                  <Sparkles size={14} />
                  <span>COR Team Managed</span>
                </div>
                <p className="text-xs text-[#141413] font-medium leading-snug">
                  Our career advisors apply on your behalf.
                </p>
                <p className="text-xs text-[#6E6E69] leading-relaxed">
                  Creators do not need to submit blind applications. When our curatorial specialists confirm strong alignment with your portfolio, they package your artist statement, works, and CV to submit directly to {opportunity.company}.
                </p>
              </div>

              <div className="p-4 bg-[#FAF5EC] border border-[#EADFCF] rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#141413]">
                  <ShieldCheck size={14} className="text-[#865E16]" />
                  <span>Curatorial Consultation</span>
                </div>
                <p className="text-xs text-[#5A5A55] leading-relaxed">
                  Want to flag this opportunity to your advisor or prepare specific works for submission?
                </p>
                <Link
                  href="/cor/consultations"
                  className="w-full mt-2 py-2.5 px-4 rounded-full bg-[#141413] text-white text-xs font-semibold hover:bg-[#2A2A28] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>Discuss in Consultation</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/cor/opportunities"
              className="text-xs font-medium text-[#6E6E69] hover:text-[#141413] inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft size={13} />
              <span>Back to all opportunities</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
