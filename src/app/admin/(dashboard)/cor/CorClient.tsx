"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CorRequest,
  CorMember,
  CorOpportunity,
  CorApplication,
  CorActivity,
} from "@/lib/types";
import { CorNavTabs } from "@/components/cor/CorNavTabs";
import { ApplyForMemberModal } from "@/components/cor/ApplyForMemberModal";
import { Button } from "@/components/ui/Button";
import {
  Users,
  UserPlus,
  Briefcase,
  FileText,
  AlertCircle,
  Plus,
} from "lucide-react";

interface CorClientProps {
  requests: CorRequest[];
  members: CorMember[];
  opportunities: CorOpportunity[];
  applications: CorApplication[];
  activity: CorActivity[];
}

export function CorClient({
  requests,
  members,
  opportunities,
  applications,
}: CorClientProps) {
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const activeMembers = members.filter((m) => m.status === "active");
  const openOpportunities = opportunities.filter((o) => o.status === "open");
  
  // Exclude rejected/offer to find active applications
  const activeApplications = applications.filter((app) => 
    !["Rejected", "Offer"].includes(app.status)
  );

  const needsAttentionCount = pendingRequests.length + (activeApplications.length > 0 ? 1 : 0); // Simplified attention calculation

  const counts = {
    requests: pendingRequests.length,
    members: members.length,
    applications: applications.length,
    opportunities: openOpportunities.length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#E8E8E3]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
            <span className="text-[11px] uppercase tracking-[0.14em] font-medium text-[#71716D]">
              Career Operations & Representation
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#141413] tracking-tight">
            COR Representation<span className="italic font-normal">.</span>
          </h1>
          <p className="text-xs md:text-sm text-[#71716D] font-light mt-1">
            Manage creator career opportunities, institutional applications, and represented artist rosters.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="dark"
            onClick={() => setApplyModalOpen(true)}
            className="rounded-full bg-[#141413] text-white px-4 py-2 text-xs uppercase tracking-[0.08em] font-medium shadow-soft-sm hover:bg-[#2A2A28]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply for Creator</span>
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <CorNavTabs counts={counts} />

      {/* Needs Your Attention Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
          <h2 className="text-lg font-serif font-semibold text-[#141413]">Needs Your Attention</h2>
        </div>
        <div className="grid grid-cols-1 gap-3.5">
          {pendingRequests.length > 0 && (
            <div className="flex items-center justify-between p-4 sm:p-5 bg-white border border-[#E8E8E3] rounded-2xl shadow-soft-sm hover:shadow-soft-md transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#FAF5EC] border border-[#ECDDBB] flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-[#865E16]" />
                </div>
                <span className="text-sm font-medium text-[#141413]">
                  {pendingRequests.length} {pendingRequests.length === 1 ? "creator is" : "creators are"} waiting for COR approval
                </span>
              </div>
              <Link href="/admin/cor/requests" className="text-xs font-medium uppercase tracking-[0.08em] text-[#141413] px-4 py-2 border border-[#E8E8E3] rounded-full bg-white hover:bg-[#FAF5EC] hover:border-[#141413] transition-colors shadow-soft-sm">
                Review Requests
              </Link>
            </div>
          )}

          {activeApplications.length > 0 && (
            <div className="flex items-center justify-between p-4 sm:p-5 bg-white border border-[#E8E8E3] rounded-2xl shadow-soft-sm hover:shadow-soft-md transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#EBF0F8] border border-[#C5D8F0] flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-[#295BAC]" />
                </div>
                <span className="text-sm font-medium text-[#141413]">
                  {activeApplications.length} {activeApplications.length === 1 ? "application is" : "applications are"} currently active
                </span>
              </div>
              <Link href="/admin/cor/applications" className="text-xs font-medium uppercase tracking-[0.08em] text-[#141413] px-4 py-2 border border-[#E8E8E3] rounded-full bg-white hover:bg-[#FAF5EC] hover:border-[#141413] transition-colors shadow-soft-sm">
                View Applications
              </Link>
            </div>
          )}

          {openOpportunities.length > 0 && (
            <div className="flex items-center justify-between p-4 sm:p-5 bg-white border border-[#E8E8E3] rounded-2xl shadow-soft-sm hover:shadow-soft-md transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#EAF2EC] border border-[#D4E6D8] flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-[#28633B]" />
                </div>
                <span className="text-sm font-medium text-[#141413]">
                  {openOpportunities.length} {openOpportunities.length === 1 ? "opportunity is" : "opportunities are"} available to match
                </span>
              </div>
              <Link href="/admin/cor/opportunities" className="text-xs font-medium uppercase tracking-[0.08em] text-[#141413] px-4 py-2 border border-[#E8E8E3] rounded-full bg-white hover:bg-[#FAF5EC] hover:border-[#141413] transition-colors shadow-soft-sm">
                View Opportunities
              </Link>
            </div>
          )}

          {pendingRequests.length === 0 && activeApplications.length === 0 && openOpportunities.length === 0 && (
            <div className="p-8 text-center text-xs text-[#71716D] border border-[#E8E8E3] rounded-2xl bg-white shadow-soft-sm">
              No items need your immediate attention right now. All pipelines are up to date.
            </div>
          )}
        </div>
      </div>

      {/* Apply For Member Modal */}
      <ApplyForMemberModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        availableMembers={activeMembers}
        availableOpportunities={openOpportunities}
      />
    </div>
  );
}

