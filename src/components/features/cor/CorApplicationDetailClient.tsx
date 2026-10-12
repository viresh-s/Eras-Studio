'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Briefcase,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import type {
  CorApplication,
  CorApplicationEvent,
  CorFullProfile,
} from '@/types/cor';
import CorStatusBadge from './CorStatusBadge';

interface CorApplicationDetailClientProps {
  application: CorApplication;
  initialEvents: CorApplicationEvent[];
  consultantName: string;
  candidateProfile?: CorFullProfile;
}

export default function CorApplicationDetailClient({
  application: app,
  initialEvents: events,
  consultantName,
  candidateProfile,
}: CorApplicationDetailClientProps) {
  const opp = app.opportunity;
  const personal = candidateProfile?.personal;
  const career = candidateProfile?.career;
  const skills = candidateProfile?.skills;

  const appliedDateStr = app.applied_date
    ? new Date(app.applied_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'In Preparation';

  const updatedDateStr = app.updated_at
    ? new Date(app.updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : appliedDateStr;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 2-Column Split: Details & Candidate vs Application Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): CANDIDATE, OPPORTUNITY, and APPLICATION specs */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. OPPORTUNITY SECTION */}
          <div className="bg-white border border-[#E8E8E3] rounded-3xl p-7 sm:p-8 shadow-xs space-y-5">
            <div className="border-b border-[#F0F0EB] pb-4 space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#865E16]">
                OPPORTUNITY OVERVIEW
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#141413]">
                {opp?.role || 'Curated Opportunity'}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6E6E69] pt-0.5">
                <span className="flex items-center gap-1.5 font-medium text-[#141413]">
                  <Building size={14} className="text-[#8A8A85]" />
                  {opp?.company || 'Institution'}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-[#8A8A85]" />
                  {opp?.location || 'Flexible'}
                </span>
                <span>·</span>
                <span className="font-medium text-[#141413]">{opp?.workplace_type || 'Hybrid'}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h3 className="font-serif text-sm font-semibold text-[#141413]">
                About the Opportunity
              </h3>
              <p className="text-xs sm:text-sm text-[#5A5A55] leading-relaxed whitespace-pre-line font-normal">
                {opp?.description || 'Curated exhibition and institutional opportunity.'}
              </p>
            </div>

            {/* Skills & Practice Areas */}
            {opp?.skills && opp.skills.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#F0F0EB]">
                <h4 className="text-xs font-semibold text-[#141413]">
                  Desired Mediums & Practice Areas
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {opp.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#E8E8E3] text-xs font-medium text-[#5A5A55]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Key Opportunity Specs */}
            <div className="border-t border-[#F0F0EB] pt-4">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#F0F0EB]">
                  <dt className="text-[10px] uppercase font-semibold text-[#8A8A85]">
                    Grant / Compensation
                  </dt>
                  <dd className="font-medium text-[#141413] mt-0.5">
                    {opp?.salary_range || 'Institutional Standard'}
                  </dd>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF9F6] border border-[#F0F0EB]">
                  <dt className="text-[10px] uppercase font-semibold text-[#8A8A85]">
                    Workplace Arrangement
                  </dt>
                  <dd className="font-medium text-[#141413] mt-0.5">
                    {opp?.workplace_type || 'Hybrid'}
                  </dd>
                </div>
              </dl>
            </div>

            {opp?.external_url && (
              <div className="pt-1">
                <a
                  href={opp.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#141413] hover:underline"
                >
                  <span>View official call announcement</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          {/* 2. CANDIDATE SECTION */}
          <div className="bg-white border border-[#E8E8E3] rounded-3xl p-7 sm:p-8 shadow-xs space-y-4">
            <div className="border-b border-[#F0F0EB] pb-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#865E16]">
                  CANDIDATE INFORMATION
                </span>
                <h3 className="font-serif text-lg font-semibold text-[#141413] mt-0.5">
                  Profile linked to this submission
                </h3>
              </div>

              <Link
                href="/cor/profile"
                className="text-xs font-semibold text-[#141413] hover:underline"
              >
                View Profile
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#F0F0EB] space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#8A8A85] flex items-center gap-1">
                  <User size={12} />
                  <span>Full Name</span>
                </span>
                <p className="font-semibold text-sm text-[#141413]">
                  {personal?.full_name || 'Creator'}
                </p>
                <p className="text-[#6E6E69] flex items-center gap-1 text-[11px]">
                  <Mail size={11} />
                  <span>{personal?.email}</span>
                </p>
                {personal?.phone && (
                  <p className="text-[#6E6E69] flex items-center gap-1 text-[11px]">
                    <Phone size={11} />
                    <span>{personal.phone}</span>
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#F0F0EB] space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#8A8A85] flex items-center gap-1">
                  <Briefcase size={12} />
                  <span>Role & Specialisation</span>
                </span>
                <p className="font-semibold text-sm text-[#141413]">
                  {career?.current_role || 'Visual Artist'}
                </p>
                <p className="text-[#6E6E69] text-[11px]">
                  {career?.years_of_experience || '3+ years experience'} · {career?.employment_status || 'Independent'}
                </p>
                {skills?.specialization && (
                  <p className="text-[#6E6E69] text-[11px]">
                    Focus: {skills.specialization}
                  </p>
                )}
              </div>
            </div>

            {skills?.primary_skills && skills.primary_skills.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] uppercase font-semibold text-[#8A8A85] block mb-1.5">
                  Primary Mediums
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skills.primary_skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md bg-[#FAF9F6] border border-[#E8E8E3] text-[11px] text-[#5A5A55]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. APPLICATION METADATA SECTION */}
          <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="border-b border-[#E8E8E3] pb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#73736C]">
                APPLICATION SPECIFICATIONS
              </span>
              <h3 className="font-serif text-lg font-semibold text-[#141413] mt-0.5">
                Submission Records
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white border border-[#E8E8E3]">
                <span className="text-[10px] uppercase font-semibold text-[#8A8A85] block">
                  Applied Date
                </span>
                <span className="font-semibold text-[#141413] mt-0.5 block">
                  {appliedDateStr}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E8E8E3]">
                <span className="text-[10px] uppercase font-semibold text-[#8A8A85] block">
                  Last Updated
                </span>
                <span className="font-semibold text-[#141413] mt-0.5 block">
                  {updatedDateStr}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E8E8E3]">
                <span className="text-[10px] uppercase font-semibold text-[#8A8A85] block">
                  Career Advisor
                </span>
                <span className="font-semibold text-[#141413] mt-0.5 block">
                  {consultantName}
                </span>
              </div>
            </div>

            {app.creator_notes && (
              <div className="p-3.5 bg-white border border-[#E8E8E3] rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#8A8A85]">
                  Submission Notes
                </span>
                <p className="text-xs text-[#5A5A55] leading-relaxed">
                  {app.creator_notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Pure Read-Only Application Timeline */}
        <div className="lg:col-span-5 bg-white border border-[#E8E8E3] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#F0F0EB] pb-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#865E16]">
                AUDIT TRAIL
              </span>
              <h3 className="font-serif text-xl font-semibold text-[#141413] mt-0.5">
                Application timeline
              </h3>
              <p className="text-xs text-[#6E6E69] mt-0.5">
                Logged stage progression for this opportunity.
              </p>
            </div>

            <CorStatusBadge status={app.current_stage} />
          </div>

          {/* Timeline Events List */}
          {events && events.length > 0 ? (
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E8E8E3]">
              {events.map((evt, idx) => {
                const isLast = idx === events.length - 1;
                const dateStr = new Date(evt.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={evt.id || idx} className="relative group">
                    <div
                      className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 bg-white transition-colors ${
                        isLast
                          ? 'border-[#141413] bg-[#141413]'
                          : 'border-[#8A8A85] group-hover:border-[#141413]'
                      }`}
                    />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#141413]">{evt.title}</span>
                        <span className="text-[10px] text-[#8A8A85]">{dateStr}</span>
                      </div>
                      <span className="inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-[#FAF9F6] border border-[#F0F0EB] text-[#6E6E69]">
                        Stage: {evt.stage}
                      </span>
                      {evt.note && (
                        <p className="text-xs text-[#5A5A55] leading-relaxed bg-[#FAF9F6] p-2.5 rounded-xl border border-[#F0F0EB]">
                          {evt.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-[#FAF9F6] rounded-2xl border border-[#E8E8E3] text-xs text-[#6E6E69]">
              Initial application prepared. Curatorial review events will appear here.
            </div>
          )}

          {/* Read-Only Notice Box (Creator cannot edit timeline or change stage) */}
          <div className="pt-4 border-t border-[#F0F0EB] space-y-2">
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#E8E8E3] flex items-start gap-2.5 text-xs text-[#5A5A55]">
              <Info size={16} className="text-[#865E16] flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-[#141413] block">
                  Managed by COR Career Administration
                </span>
                <p className="text-[11px] leading-relaxed text-[#6E6E69]">
                  This application was created and is actively managed by your COR career team. Stage updates and interview confirmations are verified directly with the partner institution and logged to your timeline automatically.
                </p>
              </div>
            </div>

            <Link
              href="/cor/consultations"
              className="w-full mt-2 py-2.5 px-4 rounded-full bg-white border border-[#E8E8E3] hover:border-[#141413] text-[#141413] text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2"
            >
              <Calendar size={13} />
              <span>Discuss Application in Consultation</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
