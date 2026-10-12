'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, Building, Clock, ArrowRight, Briefcase } from 'lucide-react';
import type { CorApplication, CorApplicationStage } from '@/types/cor';
import { COR_APPLICATION_STAGES } from '@/types/cor';
import CorStatusBadge from './CorStatusBadge';

interface CorApplicationTrackerClientProps {
  initialApplications: CorApplication[];
  consultantName: string;
}

export default function CorApplicationTrackerClient({
  initialApplications,
  consultantName,
}: CorApplicationTrackerClientProps) {
  const searchParams = useSearchParams();
  const initialStage = searchParams.get('stage') || 'All';

  const [applications] = useState<CorApplication[]>(initialApplications);
  const [activeStage, setActiveStage] = useState<string>(initialStage);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Stage filter
      if (activeStage !== 'All' && app.current_stage !== activeStage) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const role = app.opportunity?.role.toLowerCase() || '';
        const company = app.opportunity?.company.toLowerCase() || '';
        if (!role.includes(q) && !company.includes(q)) return false;
      }

      return true;
    });
  }, [applications, activeStage, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Controls: Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Stages Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF9F6] rounded-full border border-[#E8E8E3] w-full md:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveStage('All')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeStage === 'All'
                ? 'bg-[#141413] text-white shadow-xs'
                : 'text-[#6E6E69] hover:text-[#141413]'
            }`}
          >
            All ({applications.length})
          </button>

          {COR_APPLICATION_STAGES.map((stage) => {
            const count = applications.filter((a) => a.current_stage === stage).length;
            return (
              <button
                key={stage}
                type="button"
                onClick={() => setActiveStage(stage)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeStage === stage
                    ? 'bg-[#141413] text-white shadow-xs'
                    : 'text-[#6E6E69] hover:text-[#141413]'
                }`}
              >
                <span>{stage}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeStage === stage ? 'bg-white/20 text-white' : 'bg-[#EFECE6] text-[#141413]'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company or role..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E8E8E3] rounded-full text-xs text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#141413] transition-colors"
          />
          <Search size={14} className="absolute left-3.5 top-2.5 text-[#8A8A85]" />
        </div>
      </div>

      {/* Applications Table / Cards */}
      {filteredApplications.length > 0 ? (
        <div className="bg-white border border-[#E8E8E3] rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] border-b border-[#E8E8E3] text-[#73736C] uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Company / Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Applied</th>
                  <th className="py-3.5 px-4">Interview</th>
                  <th className="py-3.5 px-4">Consultant</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0EB]">
                {filteredApplications.map((app) => {
                  const appliedDateStr = app.applied_date
                    ? new Date(app.applied_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  const interviewDateStr = app.interview_date
                    ? new Date(app.interview_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={app.id} className="hover:bg-[#FAF9F6] transition-colors group">
                      <td className="py-4 px-6">
                        <strong className="block font-semibold text-sm text-[#141413]">
                          {app.opportunity?.company || 'Organization'}
                        </strong>
                        <span className="text-xs text-[#6E6E69]">
                          {app.opportunity?.role || 'Curated Opportunity'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <CorStatusBadge status={app.current_stage} />
                      </td>

                      <td className="py-4 px-4 text-[#6E6E69]">{appliedDateStr}</td>

                      <td className="py-4 px-4 text-[#6E6E69]">{interviewDateStr}</td>

                      <td className="py-4 px-4 font-medium text-[#141413]">{consultantName}</td>

                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/cor/applications/${app.id}`}
                          className="px-3.5 py-1.5 rounded-full border border-[#E8E8E3] hover:border-[#141413] text-xs font-semibold text-[#141413] inline-flex items-center gap-1 group-hover:bg-white transition-all shadow-2xs"
                        >
                          <span>View</span>
                          <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E8E8E3] p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[#FAF9F6] border border-[#E8E8E3] flex items-center justify-center mx-auto mb-3 text-[#141413]">
            <Briefcase size={22} />
          </div>
          <h3 className="font-serif text-xl font-semibold text-[#141413]">
            No applications in this stage
          </h3>
          <p className="text-xs text-[#6E6E69] mt-1">
            Explore curated open calls and add opportunities to your pipeline tracker.
          </p>
          <div className="mt-4">
            <Link
              href="/cor/opportunities"
              className="px-5 py-2.5 rounded-full bg-[#141413] text-white text-xs font-semibold hover:bg-[#2A2A28] inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>Explore Opportunities</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
