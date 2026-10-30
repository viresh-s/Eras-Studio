"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CorMember, CorOpportunity, CorApplicationStatus } from "@/lib/types";
import { calculateMatch } from "@/lib/data/cor-matching";
import { createCorApplicationAction } from "@/app/admin/actions";
import { useToast } from "@/components/ui";
import { Briefcase, UserCheck, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

interface ApplyForMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableMembers: CorMember[];
  availableOpportunities: CorOpportunity[];
  initialMemberId?: string;
  initialOpportunityId?: string;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: CorApplicationStatus[] = [
  "Recommended",
  "Preparing Application",
  "Applied",
  "Screening",
  "Interview",
  "Final Round",
  "Offer",
];

export function ApplyForMemberModal({
  isOpen,
  onClose,
  availableMembers,
  availableOpportunities,
  initialMemberId,
  initialOpportunityId,
  onSuccess,
}: ApplyForMemberModalProps) {
  const toast = useToast();

  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    initialMemberId || (availableMembers[0]?.id ?? "")
  );
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>(
    initialOpportunityId || (availableOpportunities[0]?.id ?? "")
  );

  const [status, setStatus] = useState<CorApplicationStatus>("Recommended");
  const [appliedDate, setAppliedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [interviewDate, setInterviewDate] = useState<string>("");
  const [consultant, setConsultant] = useState<string>("Career Operations");
  const [adminNote, setAdminNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialMemberId) setSelectedMemberId(initialMemberId);
  }, [initialMemberId]);

  useEffect(() => {
    if (initialOpportunityId) setSelectedOpportunityId(initialOpportunityId);
  }, [initialOpportunityId]);

  const selectedMember = useMemo(
    () => availableMembers.find((m) => m.id === selectedMemberId),
    [availableMembers, selectedMemberId]
  );

  const selectedOpportunity = useMemo(
    () => availableOpportunities.find((o) => o.id === selectedOpportunityId),
    [availableOpportunities, selectedOpportunityId]
  );

  // Compute transparent rule-based match
  const matchResult = useMemo(() => {
    if (!selectedMember || !selectedOpportunity) return null;
    return calculateMatch(selectedMember, selectedOpportunity);
  }, [selectedMember, selectedOpportunity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !selectedOpportunityId) {
      toast.error("Selection Required", "Please select both a candidate and an opportunity.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCorApplicationAction({
        corMemberId: selectedMemberId,
        opportunityId: selectedOpportunityId,
        initialStatus: status,
        appliedDate,
        interviewDate: interviewDate || undefined,
        consultant,
        adminNote: adminNote.trim() || undefined,
      });

      if (!res.success) {
        toast.error("Application Failed", res.error || "Could not create application.");
      } else {
        toast.success(
          "Application Created",
          `Successfully initiated application for ${selectedMember?.name} at ${selectedOpportunity?.company}.`
        );
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch {
      toast.error("Network Error", "An error occurred while creating the application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for Member"
      description="Create a linked COR job application on behalf of an active member."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Member Selector */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.1em] text-[#6E6E69] mb-1.5">
            Select COR Member (Candidate)
          </label>
          <div className="relative">
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full text-xs md:text-sm bg-[#F2F0ED]/50 border border-[#E8E8E3] rounded-xl px-3.5 py-2.5 text-[#141413] focus:outline-none focus:bg-white focus:border-[#1345EE] transition-colors"
            >
              {availableMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.desiredRole || "Creator"} ({m.location || "Remote"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Opportunity Selector */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.1em] text-[#6E6E69] mb-1.5">
            Select Opportunity / Job
          </label>
          <select
            value={selectedOpportunityId}
            onChange={(e) => setSelectedOpportunityId(e.target.value)}
            className="w-full text-xs md:text-sm bg-[#F2F0ED]/50 border border-[#E8E8E3] rounded-xl px-3.5 py-2.5 text-[#141413] focus:outline-none focus:bg-white focus:border-[#1345EE] transition-colors"
          >
            {availableOpportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.company} — {o.title} ({o.location}, {o.workplaceType})
              </option>
            ))}
          </select>
        </div>

        {/* Transparent Rule-Based Match Breakdown Box */}
        {matchResult && selectedMember && selectedOpportunity && (
          <div className="p-5 rounded-2xl border border-[#E8E8E3] bg-[#F2F0ED]/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1345EE]" />
                <span className="text-xs font-medium uppercase tracking-[0.1em] text-[#141413]">
                  Rule-based Match Profile
                </span>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                  matchResult.scorePercentage >= 75
                    ? "bg-[#000000] text-white border-black"
                    : matchResult.scorePercentage >= 50
                    ? "bg-[#F2F0ED] text-[#141413] border-[#E8E8E3]"
                    : "bg-white text-[#6E6E69] border-[#E8E8E3]"
                }`}
              >
                {matchResult.scorePercentage}% Compatibility
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {matchResult.reasons.map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-[#E8E8E3]"
                >
                  {r.matched ? (
                    <CheckCircle2 className="w-4 h-4 text-[#1345EE] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#8A8A85] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium text-[#141413]">{r.title}</div>
                    <div className="text-[11px] text-[#6E6E69] leading-relaxed">
                      {r.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Application Status & Dates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.1em] text-[#6E6E69] mb-1.5">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CorApplicationStatus)}
              className="w-full text-xs md:text-sm bg-[#F2F0ED]/50 border border-[#E8E8E3] rounded-xl px-3.5 py-2.5 text-[#141413] focus:outline-none focus:bg-white focus:border-[#1345EE] transition-colors"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.1em] text-[#6E6E69] mb-1.5">
              Applied Date
            </label>
            <input
              type="date"
              value={appliedDate}
              onChange={(e) => setAppliedDate(e.target.value)}
              className="w-full text-xs md:text-sm bg-[#F2F0ED]/50 border border-[#E8E8E3] rounded-xl px-3.5 py-2.5 text-[#141413] focus:outline-none focus:bg-white focus:border-[#1345EE] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-[0.1em] text-[#6E6E69] mb-1.5">
              Interview Date (Optional)
            </label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full text-xs md:text-sm bg-[#F2F0ED]/50 border border-[#E8E8E3] rounded-xl px-3.5 py-2.5 text-[#141413] focus:outline-none focus:bg-white focus:border-[#1345EE] transition-colors"
            />
          </div>
        </div>

        {/* Consultant & Strategy Note */}
        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.1em] text-[#6E6E69] mb-1.5">
            Assigned Consultant / Admin
          </label>
          <input
            type="text"
            value={consultant}
            onChange={(e) => setConsultant(e.target.value)}
            placeholder="e.g. Elena Rostova"
            className="w-full text-xs md:text-sm bg-[#F2F0ED]/50 border border-[#E8E8E3] rounded-xl px-3.5 py-2.5 text-[#141413] focus:outline-none focus:bg-white focus:border-[#1345EE] transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-[0.1em] text-[#6E6E69] mb-1.5">
            Initial Application Note / Strategy (Internal)
          </label>
          <textarea
            rows={2}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="e.g. Portfolio tailored for Kyoto pavilion. Direct submission via lead recruiter."
            className="w-full text-xs md:text-sm bg-[#F2F0ED]/50 border border-[#E8E8E3] rounded-xl p-3 text-[#141413] focus:outline-none focus:bg-white focus:border-[#1345EE] transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-[#E8E8E3] flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl border border-[#E8E8E3] bg-white text-xs font-medium text-[#6E6E69] hover:text-[#141413] hover:bg-[#F2F0ED] transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="admin-btn-premium-gradient px-5 py-2.5 text-white text-xs uppercase tracking-[0.08em] font-medium inline-flex items-center justify-center cursor-pointer select-none active:scale-[0.98]"
          >
            <span>{isSubmitting ? "Submitting..." : "Submit Application on Behalf"}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 shrink-0" />
          </button>
        </div>
      </form>
    </Modal>
  );
}
