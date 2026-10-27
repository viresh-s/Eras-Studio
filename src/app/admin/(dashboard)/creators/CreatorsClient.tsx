"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  Ban,
  Award,
} from "lucide-react";
import { Creator, UserPlan } from "@/lib/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { ExportDropdown } from "@/components/admin/ExportDropdown";
import { FilterBar, FilterSelectConfig } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui";
import { updateCreatorAction } from "@/app/admin/actions";

interface CreatorsClientProps {
  initialCreators: Creator[];
  disciplines: string[];
}

type SortField = "name" | "discipline" | "plan" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

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

function getInitials(name: string): string {
  if (!name) return "C";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CreatorsClient({
  initialCreators,
  disciplines,
}: CreatorsClientProps) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get("status") || "all";

  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState(initialStatusParam);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Drawer
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update status filter if searchParams change
  useEffect(() => {
    const param = searchParams.get("status");
    if (param) {
      setSelectedStatus(param);
    }
  }, [searchParams]);

  // Filtering
  const filteredCreators = useMemo(() => {
    return creators.filter((creator) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = creator.name.toLowerCase().includes(q);
        const matchesDiscipline = creator.discipline.toLowerCase().includes(q);
        if (!matchesName && !matchesDiscipline) return false;
      }

      // Discipline filter
      if (selectedDiscipline !== "all" && creator.discipline !== selectedDiscipline) {
        return false;
      }

      // Plan filter
      if (selectedPlan !== "all" && creator.plan !== selectedPlan) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && creator.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [creators, searchQuery, selectedDiscipline, selectedPlan, selectedStatus]);

  // Sorting
  const sortedCreators = useMemo(() => {
    return [...filteredCreators].sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";

      if (sortField === "createdAt") {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortDirection === "asc" ? timeA - timeB : timeB - timeA;
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return 0;
    });
  }, [filteredCreators, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedCreators.length / pageSize));
  const paginatedCreators = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCreators.slice(start, start + pageSize);
  }, [sortedCreators, currentPage, pageSize]);

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-[#A0A09B] opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3 h-3 text-[#865E16]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#865E16]" />
    );
  };

  // Row Click opens Drawer
  const handleRowClick = (creator: Creator) => {
    setSelectedCreator(creator);
    setIsDrawerOpen(true);
  };

  // Drawer action: Approve creator (pending -> active)
  const handleApproveCreator = async () => {
    if (!selectedCreator) return;
    const previous = { ...selectedCreator };
    const updated = { ...selectedCreator, status: "active" as const };

    setSelectedCreator(updated);
    setCreators((prev) =>
      prev.map((c) => (c.id === selectedCreator.id ? updated : c))
    );

    setIsUpdating(true);
    try {
      const res = await updateCreatorAction(selectedCreator.id, {
        status: "active",
      });
      if (!res.success) {
        setSelectedCreator(previous);
        setCreators((prev) =>
          prev.map((c) => (c.id === selectedCreator.id ? previous : c))
        );
        toast.error("Failed to approve creator", res.error || "Please try again.");
      } else {
        toast.success(
          "Creator verified",
          `${selectedCreator.name} is now approved and verified in the studio directory.`
        );
      }
    } catch {
      setSelectedCreator(previous);
      setCreators((prev) =>
        prev.map((c) => (c.id === selectedCreator.id ? previous : c))
      );
      toast.error("Network error", "Could not approve creator.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Drawer action: Suspend/Revert
  const handleToggleSuspend = async () => {
    if (!selectedCreator) return;
    const nextStatus =
      selectedCreator.status === "active" ? "suspended" : "active";
    const previous = { ...selectedCreator };
    const updated = { ...selectedCreator, status: nextStatus as any };

    setSelectedCreator(updated);
    setCreators((prev) =>
      prev.map((c) => (c.id === selectedCreator.id ? updated : c))
    );

    setIsUpdating(true);
    try {
      const res = await updateCreatorAction(selectedCreator.id, {
        status: nextStatus,
      });
      if (!res.success) {
        setSelectedCreator(previous);
        setCreators((prev) =>
          prev.map((c) => (c.id === selectedCreator.id ? previous : c))
        );
        toast.error("Failed to update status", res.error || "Please try again.");
      } else {
        toast.success(
          nextStatus === "suspended" ? "Creator suspended" : "Suspension reverted",
          nextStatus === "suspended"
            ? `${selectedCreator.name} is now suspended.`
            : `Suspension reverted. ${selectedCreator.name} is active.`
        );
      }
    } catch {
      setSelectedCreator(previous);
      setCreators((prev) =>
        prev.map((c) => (c.id === selectedCreator.id ? previous : c))
      );
      toast.error("Network error", "Could not update creator status.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Drawer action: Change plan
  const handleChangePlan = async (newPlan: UserPlan) => {
    if (!selectedCreator || selectedCreator.plan === newPlan) return;
    const creatorName = selectedCreator.name;
    const previous = { ...selectedCreator };
    const updated = { ...selectedCreator, plan: newPlan };

    setSelectedCreator(updated);
    setCreators((prev) =>
      prev.map((c) => (c.id === selectedCreator.id ? updated : c))
    );

    setIsUpdating(true);
    try {
      const res = await updateCreatorAction(selectedCreator.id, {
        plan: newPlan,
      });
      if (!res.success) {
        setSelectedCreator(previous);
        setCreators((prev) =>
          prev.map((c) => (c.id === selectedCreator.id ? previous : c))
        );
        toast.error("Failed to update plan", res.error || "Please try again.");
      } else {
        toast.success("Plan updated", `${creatorName} is now on the ${newPlan?.toUpperCase()} tier.`);
      }
    } catch {
      setSelectedCreator(previous);
      setCreators((prev) =>
        prev.map((c) => (c.id === selectedCreator.id ? previous : c))
      );
      toast.error("Network error", "Could not update plan.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter Bar configuration reusing FilterBar component
  const filterConfigs: FilterSelectConfig[] = [
    {
      id: "discipline",
      label: "Discipline",
      value: selectedDiscipline,
      onChange: (val) => {
        setSelectedDiscipline(val);
        setCurrentPage(1);
      },
      options: [
        { label: "All Disciplines", value: "all" },
        ...disciplines.map((d) => ({ label: d, value: d })),
      ],
    },
    {
      id: "plan",
      label: "Plan",
      value: selectedPlan,
      onChange: (val) => {
        setSelectedPlan(val);
        setCurrentPage(1);
      },
      options: [
        { label: "All Plans", value: "all" },
        { label: "Free", value: "free" },
        { label: "Elite", value: "elite" },
        { label: "Pro", value: "pro" },
      ],
    },
    {
      id: "status",
      label: "Status",
      value: selectedStatus,
      onChange: (val) => {
        setSelectedStatus(val);
        setCurrentPage(1);
      },
      options: [
        { label: "All Statuses", value: "all" },
        { label: "Active", value: "active" },
        { label: "Pending", value: "pending" },
        { label: "Suspended", value: "suspended" },
      ],
    },
  ];

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedDiscipline !== "all" ||
    selectedPlan !== "all" ||
    selectedStatus !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedDiscipline("all");
    setSelectedPlan("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title & Stats */}
      <div className="border-b border-[#E8E8E3] pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 rounded-full text-[11px] font-semibold tracking-[0.2em] text-[#73736C] uppercase border border-[#E8E8E3] mb-3 shadow-2xs font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
            ARTIST DIRECTORY & VERIFICATION
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#141413]">
            Creator <span className="italic font-normal">Roster.</span>
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#6E6E69] max-w-2xl leading-relaxed">
            Curated studio artists, verification review, and exhibition tiers.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 self-start sm:self-auto">
          <ExportDropdown exportType="creators" filters={{ query: searchQuery, status: selectedStatus === "all" ? undefined : selectedStatus, plan: selectedPlan === "all" ? undefined : selectedPlan }} />
          <div className="flex items-center gap-3 text-xs px-3.5 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-[#6E6E69] font-medium shadow-2xs">
            <span>
              Total: <strong className="text-[#141413]">{creators.length}</strong>
            </span>
            <span>•</span>
            <span>
              Pending:{" "}
              <strong className="text-[#865E16]">
                {creators.filter((c) => c.status === "pending").length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Reusable FilterBar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        searchPlaceholder="Search creator or discipline..."
        filters={filterConfigs}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
        className="rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm p-4"
      >
        <span className="text-xs text-[#71716D]">
          {sortedCreators.length} {sortedCreators.length === 1 ? "creator" : "creators"} found
        </span>
      </FilterBar>

      {/* Table Container */}
      {sortedCreators.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-5 h-5 text-[#8A8A85]" />}
          title="No creators found"
          description={
            hasActiveFilters
              ? "No creators match the current filter criteria. Try resetting your search or filters."
              : "No creators registered in the studio roster yet."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" className="rounded-full px-5" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-soft-sm overflow-hidden">
            <Table className="border-none">
              <TableHeader className="bg-[#FAF5EC]/70 border-b border-[#E8E8E3]">
                <tr>
                  <TableHead>
                    <button
                      onClick={() => handleSort("name")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                    >
                      <span>Creator</span>
                      {renderSortIndicator("name")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("discipline")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                    >
                      <span>Discipline</span>
                      {renderSortIndicator("discipline")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("plan")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                    >
                      <span>Plan</span>
                      {renderSortIndicator("plan")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("status")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                    >
                      <span>Status</span>
                      {renderSortIndicator("status")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("createdAt")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                    >
                      <span>Joined</span>
                      {renderSortIndicator("createdAt")}
                    </button>
                  </TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {paginatedCreators.map((creator) => (
                  <TableRow
                    key={creator.id}
                    onClick={() => handleRowClick(creator)}
                    className="cursor-pointer hover:bg-[#FAF5EC]/30 transition-colors"
                  >
                    {/* Creator Name */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FAF5EC] border border-[#ECDDBB] flex items-center justify-center text-xs font-semibold text-[#141413] shrink-0 overflow-hidden">
                          {creator.profilePicUrl ? (
                            <img
                              src={creator.profilePicUrl}
                              alt={creator.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getInitials(creator.name)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#141413]">
                            {creator.name}
                          </p>
                          <p className="text-[11px] text-[#71716D]">
                            ID: {creator.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Discipline */}
                    <TableCell className="text-[#52524E] font-medium">
                      {creator.discipline}
                    </TableCell>

                    {/* Plan */}
                    <TableCell>
                      {creator.plan ? (
                        <Badge
                          variant={
                            creator.plan === "elite"
                              ? "warning"
                              : creator.plan === "pro"
                              ? "accent"
                              : "default"
                          }
                          size="sm"
                          className="rounded-full capitalize font-medium"
                        >
                          {creator.plan}
                        </Badge>
                      ) : (
                        <span className="text-xs text-[#8A8A85]">—</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={
                          creator.status === "active"
                            ? "success"
                            : creator.status === "pending"
                            ? "warning"
                            : "danger"
                        }
                        size="sm"
                        dot
                        className="rounded-full capitalize font-medium"
                      >
                        {creator.status}
                      </Badge>
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell className="text-xs text-[#6E6E69]">
                      {formatDate(creator.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Reusable Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={sortedCreators.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Side Drawer: Reusing Drawer component for Creator details & actions */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedCreator?.name || "Creator Profile"}
        description="Curatorial review, plan tier, and studio permissions"
        footer={
          selectedCreator && (
            <div className="flex items-center justify-between w-full">
              {selectedCreator.status === "pending" ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApproveCreator}
                  isLoading={isUpdating}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  className="rounded-full px-5"
                >
                  Approve Creator
                </Button>
              ) : (
                <Button
                  variant={
                    selectedCreator.status === "active" ? "outline" : "primary"
                  }
                  size="sm"
                  onClick={handleToggleSuspend}
                  isLoading={isUpdating}
                  className="rounded-full px-5"
                  leftIcon={
                    selectedCreator.status === "active" ? (
                      <Ban className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {selectedCreator.status === "active"
                    ? "Suspend Creator"
                    : "Revert Suspension"}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-full px-4"
              >
                Done
              </Button>
            </div>
          )
        }
      >
        {selectedCreator && (
          <div className="space-y-6">
            {/* Header in Drawer */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-[#E8E8E3]">
              <div className="w-12 h-12 rounded-full bg-[#FAF5EC] border border-[#ECDDBB] flex items-center justify-center text-base font-semibold text-[#141413] shrink-0 overflow-hidden">
                {selectedCreator.profilePicUrl ? (
                  <img
                    src={selectedCreator.profilePicUrl}
                    alt={selectedCreator.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(selectedCreator.name)
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-serif text-base font-semibold text-[#141413] truncate">
                  {selectedCreator.name}
                </h4>
                <p className="text-xs text-[#6E6E69] truncate">
                  {selectedCreator.discipline}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Badge
                    variant={
                      selectedCreator.status === "active"
                        ? "success"
                        : selectedCreator.status === "pending"
                        ? "warning"
                        : "danger"
                    }
                    size="sm"
                    dot
                    className="rounded-full capitalize font-medium"
                  >
                    {selectedCreator.status}
                  </Badge>
                  {selectedCreator.plan && (
                    <Badge variant="accent" size="sm" className="rounded-full uppercase">
                      {selectedCreator.plan} Plan
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Action: Change Plan (Free / Elite / Pro) */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#FAF5EC]/50 border border-[#ECDDBB]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#141413] flex items-center gap-1.5 font-sans">
                  <Award className="w-3.5 h-3.5 text-[#865E16]" />
                  <span>Subscription Plan</span>
                </label>
                <span className="text-[11px] text-[#71716D]">
                  Current:{" "}
                  <strong className="capitalize text-[#141413]">
                    {selectedCreator.plan || "Free"}
                  </strong>
                </span>
              </div>
              <p className="text-[11px] text-[#6E6E69] leading-relaxed">
                Assign creator tier to adjust commission allowances and featured
                curation placement.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {(["free", "elite", "pro"] as UserPlan[]).map((plan) => {
                  const isSelected = selectedCreator.plan === plan;
                  return (
                    <button
                      key={plan}
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleChangePlan(plan)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#141413] text-white border-[#141413] shadow-xs"
                          : "bg-white text-[#52524E] border-[#E8E8E3] hover:bg-[#FAF5EC]"
                      }`}
                    >
                      {plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Creator Metadata */}
            <div className="space-y-3 text-xs">
              <h5 className="font-semibold text-[#73736C] uppercase tracking-[0.2em] text-[11px] font-sans">
                Creator Dossier
              </h5>

              <div className="flex items-center justify-between py-2.5 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Creator ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#FAF5EC] border border-[#ECDDBB] px-2 py-0.5 rounded-full">
                  {selectedCreator.id}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Linked User ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#FAF5EC] border border-[#ECDDBB] px-2 py-0.5 rounded-full">
                  {selectedCreator.userId}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Discipline</span>
                <span className="font-medium text-[#141413]">
                  {selectedCreator.discipline}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Registered Date</span>
                <span className="font-medium text-[#141413]">
                  {formatDate(selectedCreator.createdAt)}
                </span>
              </div>
            </div>

            {/* Pending Notice if Pending */}
            {selectedCreator.status === "pending" && (
              <div className="p-4 rounded-2xl bg-[#FAF5EC] border border-[#ECDDBB] text-xs text-[#865E16] space-y-1.5">
                <p className="font-semibold">Curatorial Review Required</p>
                <p className="text-[11px] text-[#865E16]/90 leading-relaxed">
                  This creator’s portfolio is in the onboarding queue. Approving
                  them will unlock public showcase permissions and exhibition
                  eligibility.
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
