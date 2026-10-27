"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CorApplication,
  CorApplicationStatus,
  CorApplicationEvent,
  CorAdminNote,
  CorMember,
  CorOpportunity,
} from "@/lib/types";
import { CorApplicationBadge, CorMemberBadge } from "@/components/cor/CorStatusBadge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui";
import {
  updateCorApplicationStatusAction,
  addCorAdminNoteAction,
  deleteCorAdminNoteAction,
} from "@/app/admin/actions";
import {
  ArrowLeft,
  Calendar,
  Building,
  User,
  Clock,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Lock,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface CorApplicationDetailClientProps {
  application: CorApplication;
  events: CorApplicationEvent[];
  adminNotes: CorAdminNote[];
  member?: CorMember | null;
  opportunity?: CorOpportunity | null;
}

const ALL_STATUSES: CorApplicationStatus[] = [
  "Recommended",
  "Preparing Application",
  "Applied",
  "Screening",
  "Interview",
  "Final Round",
  "Offer",
  "Rejected",
];

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function CorApplicationDetailClient({
  application: initialApp,
  events: initialEvents,
  adminNotes: initialNotes,
  member,
  opportunity,
}: CorApplicationDetailClientProps) {
  const toast = useToast();
  const [application, setApplication] = useState<CorApplication>(initialApp);
  const [events, setEvents] = useState<CorApplicationEvent[]>(initialEvents);
  const [notes, setNotes] = useState<CorAdminNote[]>(initialNotes);

  // Status transition state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [interviewDate, setInterviewDate] = useState(application.interviewDate || "");

  // Notes state
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Update status handler
  const handleUpdateStatus = async (newStatus: CorApplicationStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await updateCorApplicationStatusAction(
        application.id,
        newStatus,
        statusNote.trim() || undefined,
        interviewDate || undefined
      );

      if (!res.success || !res.application) {
        toast.error("Status Update Failed", res.error || "Please try again.");
      } else {
        toast.success(
          "Status Updated",
          `Application moved to '${newStatus}'. Event recorded in timeline.`
        );
        setApplication(res.application);
        setStatusNote("");

        // Append new event to timeline
        const newEventRecord: CorApplicationEvent = {
          id: `ev_${Date.now()}`,
          applicationId: application.id,
          previousStatus: application.status,
          newStatus,
          changedByName: application.consultant || "Career Operations",
          note: statusNote.trim() || `Status updated to ${newStatus}.`,
          scheduledDate: interviewDate || undefined,
          createdAt: new Date().toISOString(),
        };
        setEvents((prev) => [...prev, newEventRecord]);
      }
    } catch {
      toast.error("Network Error", "Could not update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Add internal note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const res = await addCorAdminNoteAction({
        applicationId: application.id,
        corMemberId: application.corMemberId,
        content: newNote.trim(),
      });

      if (!res.success || !res.note) {
        toast.error("Failed to add note", res.error || "Please try again.");
      } else {
        toast.success("Note Saved", "Private internal note has been saved.");
        setNotes((prev) => [res.note!, ...prev]);
        setNewNote("");
      }
    } catch {
      toast.error("Network Error", "Could not save note.");
    } finally {
      setIsAddingNote(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (id: string) => {
    try {
      const res = await deleteCorAdminNoteAction(id);
      if (res.success) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        toast.success("Note Deleted", "Internal note removed.");
      }
    } catch {
      toast.error("Error", "Could not delete note.");
    }
  };

  return (
    <div className="space-y-6 text-[#141413]">
      <div>
        <Link
          href="/admin/cor/applications"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-xs font-medium text-[#6E6E69] hover:text-[#141413] hover:bg-[#F2F0ED] transition-all shadow-soft-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Applications</span>
        </Link>
      </div>

      {/* Main Application Header Card */}
      <div className="p-6 md:p-8 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-[#141413]">
                {application.company} — <span className="italic">{application.opportunityTitle}</span>
              </h1>
              <CorApplicationBadge status={application.status} />
            </div>
            <p className="text-xs md:text-sm text-[#6E6E69] mt-1.5">
              Creator: <strong className="text-[#141413]">{application.creatorName}</strong> ({application.creatorEmail}) · Applied on {formatDate(application.appliedDate)} · Assigned to: {application.consultant}
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
            <Link
              href={`/admin/cor/members/${application.corMemberId}`}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-[#E8E8E3] bg-white text-[#141413] hover:bg-[#F2F0ED] transition-all whitespace-nowrap inline-flex items-center gap-1 shadow-soft-sm"
            >
              <span>Creator Profile</span>
              <span aria-hidden="true">→</span>
            </Link>
            {opportunity && (
              <Link
                href={`/admin/cor/opportunities/${application.opportunityId}`}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-[#E8E8E3] bg-white text-[#141413] hover:bg-[#F2F0ED] transition-all whitespace-nowrap inline-flex items-center gap-1 shadow-soft-sm"
              >
                <span>Opportunity Scope</span>
                <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </div>

        {/* Quick status bar */}
        <div className="pt-4 border-t border-[#E8E8E3] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#8A8A85] font-medium">Change Status:</span>
            <select
              value={application.status}
              disabled={isUpdatingStatus}
              onChange={(e) => handleUpdateStatus(e.target.value as CorApplicationStatus)}
              className="text-xs font-medium rounded-full px-3.5 py-1.5 border border-[#E8E8E3] bg-[#F2F0ED]/50 text-[#141413] focus:outline-none focus:border-[#1345EE]"
            >
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {application.status !== "Offer" && (
              <button
                onClick={() => handleUpdateStatus("Offer")}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-full bg-[#141413] text-white text-xs font-medium hover:bg-[#2A2A28] transition-all shadow-soft-sm whitespace-nowrap inline-flex items-center"
              >
                Mark as Offer
              </button>
            )}
            {application.status !== "Rejected" && (
              <button
                onClick={() => handleUpdateStatus("Rejected")}
                disabled={isUpdatingStatus}
                className="px-4 py-2 rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] text-xs font-medium hover:bg-[#FEE2E2] transition-all whitespace-nowrap inline-flex items-center"
              >
                Mark Rejected
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Candidate & Opportunity Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Candidate Card */}
        <div className="p-6 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-3">
            <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-[#6E6E69] flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#1345EE]" />
              <span>Creator Details</span>
            </h2>
            <Link
              href={`/admin/cor/members/${application.corMemberId}`}
              className="text-xs font-medium text-[#1345EE] hover:underline"
            >
              View Full Profile →
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {application.creatorAvatar ? (
              <img
                src={application.creatorAvatar}
                alt={application.creatorName}
                className="w-12 h-12 rounded-full object-cover border border-[#E8E8E3]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#000000] border border-black flex items-center justify-center text-sm font-medium text-white">
                {application.creatorName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-lg font-medium text-[#141413]">
                {application.creatorName}
              </div>
              <div className="text-xs text-[#6E6E69]">
                {application.creatorEmail}
              </div>
              <div className="text-xs font-medium text-[#1345EE] mt-0.5">
                Target Role: {member?.desiredRole || application.creatorRole || "Creative Practitioner"}
              </div>
            </div>
          </div>

          {member?.skills && member.skills.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] text-[#8A8A85] block mb-1.5 uppercase tracking-wider">Key Disciplines:</span>
              <div className="flex flex-wrap gap-1.5">
                {member.skills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-0.5 rounded-full bg-[#F2F0ED] border border-[#E8E8E3] text-[11px] font-medium text-[#141413]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Opportunity Card */}
        <div className="p-6 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-3">
            <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-[#6E6E69] flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-[#1345EE]" />
              <span>Opportunity Overview</span>
            </h2>
            {opportunity && (
              <Link
                href={`/admin/cor/opportunities/${opportunity.id}`}
                className="text-xs font-medium text-[#1345EE] hover:underline"
              >
                View Opportunity →
              </Link>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="text-lg font-medium text-[#141413]">
              {application.opportunityTitle}
            </div>
            <div className="text-[#6E6E69]">
              {application.company} · {application.location || opportunity?.location || "Remote"} ({application.workplaceType || opportunity?.workplaceType || "Remote"})
            </div>
            <div className="font-medium text-[#141413] pt-1">
              Salary / Budget: <span className="text-sm font-medium">{application.salary || opportunity?.salary || "Competitive"}</span>
            </div>
            {opportunity?.recruiterContact && (
              <div className="text-[#5E5E59] pt-1">
                Recruiter Contact: {opportunity.recruiterContact}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHRONOLOGICAL EVENT TIMELINE (Phase 14) */}
      <div className="p-6 md:p-8 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-4">
          <div>
            <h2 className="text-lg font-medium text-[#141413] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1345EE]" />
              <span>Application Timeline & Events</span>
            </h2>
            <p className="text-xs text-[#6E6E69] mt-0.5">
              Complete chronological audit trail. Events are database-backed and never overwritten.
            </p>
          </div>
          <span className="text-xs font-medium text-white bg-[#000000] px-3 py-1 rounded-full border border-black">
            {events.length} Timeline Events
          </span>
        </div>

        {/* Timeline Items */}
        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8E8E3]">
          {events.map((ev, index) => (
            <div key={ev.id || index} className="relative group">
              {/* Dot */}
              <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-[#1345EE] shadow-xs" />

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <CorApplicationBadge status={ev.newStatus} />
                  {ev.previousStatus && (
                    <span className="text-[11px] text-[#8A8A85]">
                      (from {ev.previousStatus})
                    </span>
                  )}
                  <span className="text-[11px] text-[#8A8A85] ml-auto">
                    {formatDate(ev.createdAt)}
                  </span>
                </div>

                {ev.note && (
                  <p className="text-[#141413] bg-[#F2F0ED]/50 p-3 rounded-xl border border-[#E8E8E3] mt-1.5 leading-relaxed">
                    {ev.note}
                  </p>
                )}

                {ev.scheduledDate && (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#1345EE] pt-0.5">
                    <Calendar className="w-3 h-3" />
                    <span>Scheduled for {formatDate(ev.scheduledDate)}</span>
                  </div>
                )}

                <div className="text-[10px] text-[#8A8A85] pt-0.5">
                  Logged by: {ev.changedByName || "Career Operations"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Update / Advance Stage Box */}
        <div className="pt-5 border-t border-[#E8E8E3] space-y-3">
          <label className="block text-xs font-medium uppercase tracking-[0.1em] text-[#6E6E69]">
            Advance Application Stage or Record Interview
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={application.status}
              onChange={(e) => handleUpdateStatus(e.target.value as CorApplicationStatus)}
              className="text-xs bg-[#F2F0ED]/50 border border-[#E8E8E3] rounded-xl px-3.5 py-2.5 text-[#141413] focus:outline-none focus:border-[#1345EE]"
            >
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  Move to {st}
                </option>
              ))}
            </select>

            <input
              type="date"
              placeholder="Schedule interview date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="text-xs bg-[#F2F0ED]/50 border border-[#E8E8E3] rounded-xl px-3.5 py-2.5 text-[#141413] focus:outline-none focus:border-[#1345EE]"
            />

            <input
              type="text"
              placeholder="Timeline note / update details..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="text-xs bg-[#F2F0ED]/50 border border-[#E8E8E3] rounded-xl px-3.5 py-2.5 text-[#141413] focus:outline-none focus:border-[#1345EE]"
            />
          </div>
        </div>
      </div>

      {/* INTERNAL TEAM NOTES (PRIVACY: ADMIN ONLY) */}
      <div className="p-6 md:p-8 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#E8E8E3] pb-4">
          <div>
            <h2 className="text-lg font-medium text-[#141413] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#1345EE]" />
              <span>Internal Team Notes & Application Strategy</span>
            </h2>
            <p className="text-xs text-[#6E6E69] mt-0.5">
              Private notes between career advisors, recruiters, and admins. Never exposed to candidates.
            </p>
          </div>
          <span className="text-[11px] font-medium text-white px-2.5 py-0.5 rounded-full bg-[#000000] border border-black">
            Admin Only
          </span>
        </div>

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="space-y-3">
          <textarea
            rows={2}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add internal note on recruiter follow-up, candidate prep, salary negotiation strategy..."
            className="w-full text-xs md:text-sm bg-[#F2F0ED]/50 border border-[#E8E8E3] rounded-xl p-3.5 text-[#141413] focus:outline-none focus:border-[#1345EE]"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAddingNote}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#141413] text-white text-xs font-medium hover:bg-[#2A2A28] transition-all shadow-soft-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNote ? "Adding..." : "Add Team Note"}</span>
            </button>
          </div>
        </form>

        {/* Notes List */}
        <div className="space-y-3 pt-2">
          {notes.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6E6E69] bg-[#F2F0ED]/50 rounded-2xl border border-[#E8E8E3]">
              No internal notes recorded yet for this application.
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-2xl border border-[#E8E8E3] bg-[#F2F0ED]/50 space-y-2 text-xs shadow-soft-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#141413] flex items-center gap-2">
                    <Lock className="w-3 h-3 text-[#1345EE]" />
                    <span>{note.authorName}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#8A8A85]">
                      {formatDate(note.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-[#8A8A85] hover:text-[#B91C1C] p-1 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[#5E5E59] leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
