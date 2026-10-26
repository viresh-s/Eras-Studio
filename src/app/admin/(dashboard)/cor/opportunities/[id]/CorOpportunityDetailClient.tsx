"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CorOpportunity,
  CorOpportunityStatus,
  CorApplication,
  CorMember,
  CorApplicationStatus,
} from "@/lib/types";
import { CorOpportunityBadge, CorApplicationBadge } from "@/components/cor/CorStatusBadge";
import { ApplyForMemberModal } from "@/components/cor/ApplyForMemberModal";
import { rankMembersForOpportunity } from "@/lib/data/cor-matching";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui";
import {
  updateCorApplicationStatusAction,
  updateCorOpportunityAction,
} from "@/app/admin/actions";
import {
  ArrowLeft,
  Briefcase,
  Send,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Building,
  MapPin,
  Clock,
} from "lucide-react";

interface CorOpportunityDetailClientProps {
  opportunity: CorOpportunity;
  applications: CorApplication[];
  availableMembers: CorMember[];
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function CorOpportunityDetailClient({
  opportunity: initialOpp,
  applications: initialApps,
  availableMembers,
}: CorOpportunityDetailClientProps) {
  const toast = useToast();
  const [opportunity, setOpportunity] = useState<CorOpportunity>(initialOpp);
  const [applications, setApplications] = useState<CorApplication[]>(initialApps);

  // Apply modal
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>();

  // Ranked members
  const rankedMembers = rankMembersForOpportunity(availableMembers, opportunity);

  const handleStatusChange = async (appId: string, newStatus: CorApplicationStatus) => {
    try {
      const res = await updateCorApplicationStatusAction(appId, newStatus);
      if (res.success && res.application) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? res.application! : a))
        );
        toast.success("Status Updated", `Application moved to ${newStatus}.`);
      } else {
        toast.error("Failed to update status", res.error || "Please try again.");
      }
    } catch {
      toast.error("Network Error", "Could not update status.");
    }
  };

  const handleToggleOpportunityStatus = async () => {
    const nextStatus: CorOpportunityStatus = opportunity.status === "open" ? "closed" : "open";
    try {
      const res = await updateCorOpportunityAction(opportunity.id, { status: nextStatus });
      if (res.success && res.opportunity) {
        setOpportunity(res.opportunity);
        toast.success("Opportunity Status Updated", `Opportunity marked as ${nextStatus}.`);
      }
    } catch {
      toast.error("Update failed", "Please try again.");
    }
  };

  return (
    <div className="space-y-6 text-[#141413]">
      <div>
        <Link
          href="/admin/cor/opportunities"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-xs font-medium text-[#6E6E69] hover:text-[#141413] hover:bg-[#FAF5EC] transition-all shadow-soft-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Opportunities</span>
        </Link>
      </div>

      {/* Main Opportunity Card */}
      <div className="p-6 md:p-8 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-serif font-normal tracking-tight text-[#141413]">
                {opportunity.title}
              </h1>
              <CorOpportunityBadge status={opportunity.status} />
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-[#6E6E69] mt-1.5 font-medium">
              <Building className="w-4 h-4 text-[#865E16]" />
              <span className="text-[#141413]">{opportunity.company}</span>
              <span>·</span>
              <MapPin className="w-4 h-4 text-[#8A8A85]" />
              <span>{opportunity.location} ({opportunity.workplaceType})</span>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <button
              onClick={handleToggleOpportunityStatus}
              className="px-4 py-2 rounded-full border border-[#E8E8E3] bg-white text-xs font-medium text-[#6E6E69] hover:text-[#141413] hover:bg-[#FAF5EC] transition-all shadow-soft-sm"
            >
              <span>{opportunity.status === "open" ? "Close Opportunity" : "Reopen Opportunity"}</span>
            </button>
            <button
              onClick={() => {
                setSelectedMemberId(undefined);
                setApplyModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#141413] text-white text-xs font-medium hover:bg-[#2A2A28] transition-all shadow-soft-sm tracking-[0.04em]"
            >
              <Send className="w-3.5 h-3.5 shrink-0" />
              <span>Apply for Candidate</span>
            </button>
          </div>
        </div>

        {/* Quick summary grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-[#E8E8E3] text-xs">
          <div className="p-3.5 rounded-xl bg-[#FAF5EC]/70 border border-[#E8E8E3]/60">
            <span className="text-[#8A8A85] text-[11px] uppercase tracking-wider block">Salary / Budget</span>
            <div className="font-serif text-lg text-[#141413] mt-0.5">
              {opportunity.salary || "Competitive"}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF5EC]/70 border border-[#E8E8E3]/60">
            <span className="text-[#8A8A85] text-[11px] uppercase tracking-wider block">Active Applications</span>
            <div className="font-serif text-xl text-[#141413] mt-0.5">
              {applications.length}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF5EC]/70 border border-[#E8E8E3]/60">
            <span className="text-[#8A8A85] text-[11px] uppercase tracking-wider block">Deadline</span>
            <div className="font-serif text-base text-[#141413] mt-0.5">
              {opportunity.applicationDeadline ? formatDate(opportunity.applicationDeadline) : "Open"}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#FAF5EC]/70 border border-[#E8E8E3]/60">
            <span className="text-[#8A8A85] text-[11px] uppercase tracking-wider block">Recruiter / Contact</span>
            <div className="font-serif text-base text-[#865E16] mt-0.5 truncate">
              {opportunity.recruiterContact || opportunity.recruiterEmail || "Direct Portal"}
            </div>
          </div>
        </div>

        {/* Description & Required Skills */}
        <div className="pt-2 text-xs space-y-4">
          {opportunity.description && (
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.1em] text-[#6E6E69] block mb-1.5">
                Opportunity Scope & Details:
              </span>
              <p className="text-[#5E5E59] leading-relaxed whitespace-pre-wrap">
                {opportunity.description}
              </p>
            </div>
          )}

          <div>
            <span className="text-xs font-medium uppercase tracking-[0.1em] text-[#6E6E69] block mb-2">
              Target Skills:
            </span>
            <div className="flex flex-wrap gap-2">
              {opportunity.requiredSkills.map((s) => (
                <span
                  key={s}
                  className="px-3.5 py-1 rounded-full bg-[#FAF5EC] border border-[#E8E8E3] text-xs font-medium text-[#141413]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {opportunity.jobUrl && (
            <div className="pt-2">
              <a
                href={opportunity.jobUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#865E16] hover:underline"
              >
                <span>External Listing URL</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Applied Candidates Section */}
      <div className="bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden shadow-soft-sm">
        <div className="p-5 border-b border-[#E8E8E3] flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg text-[#141413]">
              Applied COR Candidates ({applications.length})
            </h2>
            <p className="text-xs text-[#6E6E69] mt-0.5">
              Candidates currently submitted on behalf of Career Operations.
            </p>
          </div>
        </div>

        <div className="divide-y divide-[#E8E8E3]">
          {applications.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#6E6E69]">
              No applications submitted yet for this opportunity. Use candidate matching below to submit representation.
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF5EC]/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  {app.creatorAvatar ? (
                    <img
                      src={app.creatorAvatar}
                      alt={app.creatorName}
                      className="w-10 h-10 rounded-full object-cover border border-[#E8E8E3]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#FAF5EC] border border-[#E8E8E3] flex items-center justify-center text-xs font-serif text-[#141413]">
                      {app.creatorName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-serif text-base text-[#141413]">
                      {app.creatorName}
                    </div>
                    <div className="text-xs text-[#6E6E69]">
                      Applied on {formatDate(app.appliedDate)} · Assigned: {app.consultant}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Dropdown */}
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value as CorApplicationStatus)}
                    className="text-xs font-medium border border-[#E8E8E3] rounded-full px-3 py-1.5 bg-[#FAF5EC]/50 text-[#141413] focus:outline-none focus:border-[#865E16]"
                  >
                    {[
                      "Recommended",
                      "Preparing Application",
                      "Applied",
                      "Screening",
                      "Interview",
                      "Final Round",
                      "Offer",
                      "Rejected",
                    ].map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>

                  <Link
                    href={`/admin/cor/applications/${app.id}`}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-[#E8E8E3] bg-white text-[#141413] hover:bg-[#FAF5EC] whitespace-nowrap inline-flex items-center gap-1 shadow-soft-sm transition-all"
                  >
                    <span>Timeline</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Candidate Match Ranking */}
      <div className="space-y-4">
        <div className="p-5 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg text-[#141413] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#865E16]" />
              <span>Available COR Member Matches</span>
            </h2>
            <p className="text-xs text-[#6E6E69] mt-0.5">
              Rule-based compatibility scores based on candidate skills, desired role, and preferences.
            </p>
          </div>
          <span className="text-xs font-medium text-[#865E16] bg-[#FAF5EC] px-3 py-1 rounded-full border border-[#E8E8E3]">
            {rankedMembers.length} Members Evaluated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rankedMembers.map((match) => (
            <div
              key={match.member.id}
              className="p-6 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {match.member.creatorAvatar ? (
                      <img
                        src={match.member.creatorAvatar}
                        alt={match.member.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#E8E8E3]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#FAF5EC] border border-[#E8E8E3] flex items-center justify-center text-xs font-serif text-[#141413]">
                        {match.member.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-serif text-base text-[#141413]">
                        {match.member.name}
                      </div>
                      <div className="text-xs text-[#6E6E69]">
                        {match.member.desiredRole} · {match.member.location || "Remote"}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${
                      match.scorePercentage >= 75
                        ? "bg-[#FAF5EC] text-[#865E16] border-[#865E16]/30"
                        : match.scorePercentage >= 50
                        ? "bg-[#FAF5EC] text-[#141413] border-[#E8E8E3]"
                        : "bg-white text-[#6E6E69] border-[#E8E8E3]"
                    }`}
                  >
                    {match.scorePercentage}% Match
                  </span>
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-[#E8E8E3] text-xs">
                  {match.reasons.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {r.matched ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#865E16] shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8A8A85] shrink-0 ml-1 mr-1" />
                      )}
                      <span className="text-[11px] text-[#5E5E59] truncate">{r.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E8E3] flex justify-end">
                <button
                  onClick={() => {
                    setSelectedMemberId(match.member.id);
                    setApplyModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141413] text-white text-xs font-medium hover:bg-[#2A2A28] transition-all shadow-soft-sm"
                >
                  <Send className="w-3 h-3 shrink-0" />
                  <span>Apply for {match.member.name}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Apply Modal */}
      {applyModalOpen && (
        <ApplyForMemberModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          availableMembers={availableMembers}
          availableOpportunities={[opportunity]}
          initialMemberId={selectedMemberId}
          initialOpportunityId={opportunity.id}
          onSuccess={() => {
            // refresh
          }}
        />
      )}
    </div>
  );
}
