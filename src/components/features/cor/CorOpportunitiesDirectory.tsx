'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Sparkles, Filter, Briefcase, ArrowLeft } from 'lucide-react';
import type { CorOpportunity } from '@/types/cor';
import CorOpportunityCard from './CorOpportunityCard';

interface CorOpportunitiesDirectoryProps {
  initialOpportunities: CorOpportunity[];
  existingAppliedIds: string[];
}

export default function CorOpportunitiesDirectory({
  initialOpportunities,
  existingAppliedIds,
}: CorOpportunitiesDirectoryProps) {
  const [opportunities] = useState<CorOpportunity[]>(initialOpportunities);
  const [searchQuery, setSearchQuery] = useState('');
  const [workplaceFilter, setWorkplaceFilter] = useState<string>('All');
  const [onlyMatched, setOnlyMatched] = useState(false);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRole = opp.role.toLowerCase().includes(q);
        const matchesCompany = opp.company.toLowerCase().includes(q);
        const matchesLocation = opp.location.toLowerCase().includes(q);
        const matchesSkills = opp.skills.some((s) => s.toLowerCase().includes(q));
        if (!matchesRole && !matchesCompany && !matchesLocation && !matchesSkills) return false;
      }

      // Workplace tab
      if (workplaceFilter !== 'All') {
        if (opp.workplace_type.toLowerCase() !== workplaceFilter.toLowerCase()) return false;
      }

      // Only matched toggle
      if (onlyMatched && !opp.is_matched) {
        return false;
      }

      return true;
    });
  }, [opportunities, searchQuery, workplaceFilter, onlyMatched]);

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search & Filter Tabs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Workplace Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF9F6] rounded-full border border-[#E8E8E3] w-full md:w-auto overflow-x-auto">
          {['All', 'Remote', 'Hybrid', 'Onsite'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setWorkplaceFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                workplaceFilter === tab
                  ? 'bg-[#141413] text-white shadow-xs'
                  : 'text-[#6E6E69] hover:text-[#141413]'
              }`}
            >
              {tab === 'All' ? `All Calls (${opportunities.length})` : tab}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setOnlyMatched(!onlyMatched)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              onlyMatched
                ? 'bg-[#FAF5EC] text-[#865E16] border border-[#EADFCF]'
                : 'text-[#6E6E69] hover:text-[#141413]'
            }`}
          >
            <Sparkles size={11} className={onlyMatched ? 'text-[#865E16]' : ''} />
            <span>High Matches</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roles, mediums, or locations..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E8E8E3] rounded-full text-xs text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#141413] transition-colors"
          />
          <Search size={14} className="absolute left-3.5 top-2.5 text-[#8A8A85]" />
        </div>
      </div>

      {/* Grid of Opportunities */}
      {filteredOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredOpportunities.map((opp) => (
            <CorOpportunityCard
              key={opp.id}
              opportunity={opp}
              isApplied={existingAppliedIds.includes(opp.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E8E8E3] p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[#FAF9F6] border border-[#E8E8E3] flex items-center justify-center mx-auto mb-3 text-[#141413]">
            <Briefcase size={22} />
          </div>
          <h3 className="font-serif text-xl font-semibold text-[#141413]">
            No opportunities matched
          </h3>
          <p className="text-xs text-[#6E6E69] mt-1">
            Try adjusting your search keywords or switching filters.
          </p>
        </div>
      )}
    </div>
  );
}
