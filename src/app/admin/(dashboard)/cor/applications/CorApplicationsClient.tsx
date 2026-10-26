"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CorApplication,
  CorApplicationStatus,
  CorMember,
  CorOpportunity,
} from "@/lib/types";
import { CorApplicationBadge } from "@/components/cor/CorStatusBadge";
import { CorNavTabs } from "@/components/cor/CorNavTabs";
import { ApplyForMemberModal } from "@/components/cor/ApplyForMemberModal";
import { ExportDropdown } from "@/components/admin/ExportDropdown";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui";
import { updateCorApplicationStatusAction } from "@/app/admin/actions";
import {
  Search,
  Plus,
  Send,
  Building,
  User,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

interface CorApplicationsClientProps {
  initialApplications: CorApplication[];
  availableMembers: CorMember[];
  availableOpportunities: CorOpportunity[];
  counts: {
    requests: number;
    members: number;
    applications: number;
    opportunities: number;
  };
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
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function CorApplicationsClient({
  initialApplications,
  availableMembers,
  availableOpportunities,
  counts,
}: CorApplicationsClientProps) {
  const toast = useToast();
  const [applications, setApplications] = useState<CorApplication[]>(initialApplications);
  const [statusFilter, setStatusFilter] = useState<CorApplicationStatus | "all">("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Apply for Member Modal
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  // Status updating indicator
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Extract unique companies for filter
  const uniqueCompanies = useMemo(() => {
    const set = new Set(applications.map((a) => a.company));
    return Array.from(set).sort();
  }, [applications]);

  // Compute status summary counts
  const statusCounts = useMemo(() => {
    const map: Record<string, number> = { all: applications.length };
    for (const st of ALL_STATUSES) {
      map[st] = applications.filter((a) => a.status === st).length;
    }
    return map;
  }, [applications]);

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (companyFilter !== "all" && app.company !== companyFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inCandidate = app.creatorName.toLowerCase().includes(q);
        const inCompany = app.company.toLowerCase().includes(q);
        const inRole = app.opportunityTitle.toLowerCase().includes(q);
        const inConsultant = app.consultant.toLowerCase().includes(q);
        if (!inCandidate && !inCompany && !inRole && !inConsultant) return false;
      }
      return true;
    });
  }, [applications, statusFilter, companyFilter, searchQuery]);

  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, currentPage, pageSize]);

  const exportColumns = [
    { header: "Creator", key: "creatorName" },
    { header: "Company", key: "company" },
    { header: "Opportunity", key: "opportunityTitle" },
    { header: "Application Date", key: (row: CorApplication) => formatDate(row.appliedDate) },
    { header: "Current Stage", key: "status" },
    { header: "Interview Date", key: (row: CorApplication) => row.interviewDate ? formatDate(row.interviewDate) : "—" },
    { header: "Managed By", key: "consultant" },
  ];

  // Handle inline interactive status update
  const handleStatusChange = async (appId: string, newStatus: CorApplicationStatus) => {
    setUpdatingId(appId);
    const previous = [...applications];

    // Optimistic UI update
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );

    try {
      const res = await updateCorApplicationStatusAction(appId, newStatus);
      if (!res.success || !res.application) {
        setApplications(previous);
        toast.error("Status Update Failed", res.error || "Please try again.");
      } else {
        toast.success(
          "Status Updated",
          `Application for ${res.application.creatorName} at ${res.application.company} moved to '${newStatus}'.`
        );
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? res.application! : a))
        );
      }
    } catch {
      setApplications(previous);
      toast.error("Network Error", "Could not update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Reference Header matching Prototype */}
      <div className="border-b border-[#E8E8E3] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#865E16] mb-1">
            Institutional Representation
          </p>
          <h1 className="text-3xl font-serif font-normal tracking-tight text-[#141413]">
            Representation Applications.
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6E69] mt-1 max-w-2xl">
            Keep every candidate and opportunity moving together. Update pipeline stages, manage interviews, and track offers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <ExportDropdown exportType="cor-applications" filters={{ query: searchQuery, status: statusFilter === "all" ? undefined : statusFilter, company: companyFilter === "all" ? undefined : companyFilter }} />
          <button
            onClick={() => setApplyModalOpen(true)}
            className="shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#141413] hover:bg-[#2A2A28] text-white text-xs font-medium tracking-[0.04em] shadow-soft-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply for Creator</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <CorNavTabs counts={counts} />

      {/* Search and Filters Bar */}
      <div className="p-2 sm:p-2.5 rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Pill Tabs (Reference Prototype Style) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              statusFilter === "all"
                ? "bg-[#141413] text-white shadow-soft-sm"
                : "text-[#6E6E69] hover:text-[#141413] hover:bg-[#FAF5EC]"
            }`}
          >
            <span>All</span>
            <span className={`text-[11px] px-2 py-0.2 rounded-full ${
              statusFilter === "all" ? "bg-white/20 text-white" : "bg-[#FAF5EC] text-[#865E16]"
            }`}>
              {statusCounts.all}
            </span>
          </button>

          {ALL_STATUSES.map((st) => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                  active
                    ? "bg-[#141413] text-white shadow-soft-sm"
                    : "text-[#6E6E69] hover:text-[#141413] hover:bg-[#FAF5EC]"
                }`}
              >
                <span>{st}</span>
                <span className={`text-[11px] px-2 py-0.2 rounded-full ${
                  active ? "bg-white/20 text-white" : "bg-[#FAF5EC] text-[#865E16]"
                }`}>
                  {statusCounts[st] || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Company filter and Search */}
        <div className="flex items-center gap-2">
          {uniqueCompanies.length > 0 && (
            <select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-[#FAF5EC]/50 border border-[#E8E8E3] rounded-full px-3 py-1.5 text-[#141413] focus:outline-none focus:bg-white focus:border-[#865E16] transition-colors"
            >
              <option value="all">All Companies</option>
              {uniqueCompanies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#8A8A85] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company or candidate..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-[#FAF5EC]/50 border border-[#E8E8E3] rounded-full pl-9 pr-3.5 py-2 text-[#141413] placeholder-[#8A8A85] focus:outline-none focus:bg-white focus:border-[#865E16] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Applications Data Table */}
      <div className="bg-white border border-[#E8E8E3] rounded-2xl overflow-hidden shadow-soft-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#FAF5EC]/70 border-b border-[#E8E8E3]">
              <TableHead className="py-3 px-5 text-[11px] font-medium text-[#8A8A85] uppercase tracking-wider">
                Opportunity
              </TableHead>
              <TableHead className="py-3 px-5 text-[11px] font-medium text-[#8A8A85] uppercase tracking-wider">
                Creator
              </TableHead>
              <TableHead className="py-3 px-5 text-[11px] font-medium text-[#8A8A85] uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="py-3 px-5 text-[11px] font-medium text-[#8A8A85] uppercase tracking-wider">
                Applied On
              </TableHead>
              <TableHead className="py-3 px-5 text-[11px] font-medium text-[#8A8A85] uppercase tracking-wider">
                Interview
              </TableHead>
              <TableHead className="py-3 px-5 text-[11px] font-medium text-[#8A8A85] uppercase tracking-wider">
                Managed By
              </TableHead>
              <TableHead className="py-3 px-5 text-[11px] font-medium text-[#8A8A85] uppercase tracking-wider text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12">
                  <EmptyState
                    title="No applications found"
                    description="No COR applications match your current filters. Click 'Apply for Member' to start a new application."
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedApplications.map((app) => (
                <TableRow
                  key={app.id}
                  className="hover:bg-[#FAF5EC]/40 transition-colors border-b border-[#E8E8E3] last:border-none"
                >
                  {/* Company & Role */}
                  <TableCell className="py-3.5 px-5">
                    <Link
                      href={`/admin/cor/applications/${app.id}`}
                      className="group block"
                    >
                      <div className="font-serif text-base text-[#141413] group-hover:text-[#865E16] transition-colors">
                        {app.company}
                      </div>
                      <div className="text-xs text-[#6E6E69]">
                        {app.opportunityTitle}
                      </div>
                    </Link>
                  </TableCell>

                  {/* Candidate / Creator */}
                  <TableCell className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      {app.creatorAvatar ? (
                        <img
                          src={app.creatorAvatar}
                          alt={app.creatorName}
                          className="w-8 h-8 rounded-full object-cover border border-[#E8E8E3]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#FAF5EC] border border-[#E8E8E3] flex items-center justify-center text-xs font-serif text-[#141413]">
                          {app.creatorName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/admin/cor/members/${app.corMemberId}`}
                          className="font-medium text-xs text-[#141413] hover:text-[#865E16] transition-colors"
                        >
                          {app.creatorName}
                        </Link>
                        <div className="text-[11px] text-[#6E6E69]">
                          {app.creatorEmail}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Interactive Status Dropdown (Phase 13) */}
                  <TableCell className="py-3.5 px-5">
                    <div className="relative inline-block">
                      <select
                        value={app.status}
                        disabled={updatingId === app.id}
                        onChange={(e) =>
                          handleStatusChange(app.id, e.target.value as CorApplicationStatus)
                        }
                        className={`text-xs font-medium rounded-full px-3 py-1 border transition-all cursor-pointer focus:outline-none focus:border-[#865E16] ${
                          app.status === "Offer"
                            ? "bg-[#FAF5EC] text-[#865E16] border-[#865E16]/40"
                            : app.status === "Interview"
                            ? "bg-[#FAF5EC] text-[#865E16] border-[#865E16]/30"
                            : app.status === "Screening"
                            ? "bg-[#FAF5EC] text-[#141413] border-[#E8E8E3]"
                            : app.status === "Final Round"
                            ? "bg-[#FAF5EC] text-[#865E16] border-[#865E16]/40"
                            : app.status === "Rejected"
                            ? "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]"
                            : "bg-white text-[#141413] border-[#E8E8E3]"
                        }`}
                      >
                        {ALL_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </TableCell>

                  {/* Applied Date */}
                  <TableCell className="py-3.5 px-5 text-xs text-[#6E6E69]">
                    {formatDate(app.appliedDate)}
                  </TableCell>

                  {/* Interview Date */}
                  <TableCell className="py-3.5 px-5 text-xs text-[#141413]">
                    {app.interviewDate ? (
                      <span className="font-serif text-sm text-[#865E16]">
                        {formatDate(app.interviewDate)}
                      </span>
                    ) : (
                      <span className="text-[#8A8A85]">—</span>
                    )}
                  </TableCell>

                  {/* Consultant */}
                  <TableCell className="py-3.5 px-5 text-xs text-[#6E6E69]">
                    {app.consultant || "Career Team"}
                  </TableCell>

                  {/* Actions View */}
                  <TableCell className="py-3.5 px-5 text-right">
                    <Link
                      href={`/admin/cor/applications/${app.id}`}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium border border-[#E8E8E3] bg-white text-[#141413] hover:bg-[#FAF5EC] transition-all whitespace-nowrap inline-flex items-center gap-1 shadow-soft-sm"
                    >
                      <span>View</span>
                      <span>&rarr;</span>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredApplications.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredApplications.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Apply for Member Modal */}
      {applyModalOpen && (
        <ApplyForMemberModal
          isOpen={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          availableMembers={availableMembers}
          availableOpportunities={availableOpportunities}
          onSuccess={() => {
            // refresh
          }}
        />
      )}
    </div>
  );
}
