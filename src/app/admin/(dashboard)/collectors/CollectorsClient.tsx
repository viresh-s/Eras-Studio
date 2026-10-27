"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { Collector } from "@/lib/types";
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
import { updateCollectorAction } from "@/app/admin/actions";

interface CollectorsClientProps {
  initialCollectors: Collector[];
  preferences: string[];
  inquiryCounts?: Record<string, number>;
}

type SortField = "name" | "preferences" | "status" | "createdAt";
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
  if (!name) return "P";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CollectorsClient({
  initialCollectors,
  preferences,
  inquiryCounts = {},
}: CollectorsClientProps) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get("status") || "all";

  const [collectors, setCollectors] = useState<Collector[]>(initialCollectors);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPreferences, setSelectedPreferences] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState(initialStatusParam);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Drawer
  const [selectedCollector, setSelectedCollector] = useState<Collector | null>(null);
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
  const filteredCollectors = useMemo(() => {
    return collectors.filter((collector) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = collector.name.toLowerCase().includes(q);
        const matchesPref = (collector.preferences || "").toLowerCase().includes(q);
        if (!matchesName && !matchesPref) return false;
      }

      // Preferences filter
      if (selectedPreferences !== "all" && collector.preferences !== selectedPreferences) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && collector.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [collectors, searchQuery, selectedPreferences, selectedStatus]);

  // Sorting
  const sortedCollectors = useMemo(() => {
    return [...filteredCollectors].sort((a, b) => {
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
  }, [filteredCollectors, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedCollectors.length / pageSize));
  const paginatedCollectors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCollectors.slice(start, start + pageSize);
  }, [sortedCollectors, currentPage, pageSize]);

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
      <ArrowUp className="w-3 h-3 text-[#1345EE]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#1345EE]" />
    );
  };

  const router = useRouter();

  // Row Click navigates to Collector detail view
  const handleRowClick = (collector: Collector) => {
    router.push(`/admin/collectors/${collector.id}`);
  };

  // Drawer action: Suspend/Revert
  const handleToggleSuspend = async () => {
    if (!selectedCollector) return;
    const nextStatus =
      selectedCollector.status === "active" ? "suspended" : "active";
    const previous = { ...selectedCollector };
    const updated = { ...selectedCollector, status: nextStatus as any };

    setSelectedCollector(updated);
    setCollectors((prev) =>
      prev.map((c) => (c.id === selectedCollector.id ? updated : c))
    );

    setIsUpdating(true);
    try {
      const res = await updateCollectorAction(selectedCollector.id, {
        status: nextStatus,
      });
      if (!res.success) {
        setSelectedCollector(previous);
        setCollectors((prev) =>
          prev.map((c) => (c.id === selectedCollector.id ? previous : c))
        );
        toast.error("Failed to update status", res.error || "Please try again.");
      } else {
        toast.success(
          nextStatus === "suspended" ? "Collector suspended" : "Suspension reverted",
          nextStatus === "suspended"
            ? `${selectedCollector.name} is now suspended.`
            : `Suspension reverted. ${selectedCollector.name} is active.`
        );
      }
    } catch {
      setSelectedCollector(previous);
      setCollectors((prev) =>
        prev.map((c) => (c.id === selectedCollector.id ? previous : c))
      );
      toast.error("Network error", "Could not update collector status.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter Bar configuration
  const filterConfigs: FilterSelectConfig[] = [
    {
      id: "preferences",
      label: "Preferences",
      value: selectedPreferences,
      onChange: (val) => {
        setSelectedPreferences(val);
        setCurrentPage(1);
      },
      options: [
        { label: "All Preferences", value: "all" },
        ...preferences.map((d) => ({ label: d, value: d })),
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
    selectedPreferences !== "all" ||
    selectedStatus !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedPreferences("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Title & Stats */}
      <div className="border-b border-[#E8E8E3] pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="admin-century-title text-3xl sm:text-4xl tracking-tight text-[#141413]">
            Art Patrons & Collectors.
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#6E6E69] max-w-2xl leading-relaxed">
            Manage collectors, private acquisition inquiries, and art purchases.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 self-start sm:self-auto">
          <ExportDropdown exportType="collectors" filters={{ query: searchQuery, status: selectedStatus === "all" ? undefined : selectedStatus }} />
          <div className="flex items-center gap-3 text-xs px-3.5 py-1.5 rounded-xl border border-[#E8E8E3] bg-white text-[#6E6E69] font-medium shadow-2xs">
            <span>
              Total: <strong className="text-[#141413]">{collectors.length} patrons</strong>
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
        searchPlaceholder="Search collector or taste preference..."
        filters={filterConfigs}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
        className="rounded-2xl border border-[#E8E8E3] bg-white shadow-soft-sm p-4"
      >
        <span className="text-xs text-[#71716D]">
          {sortedCollectors.length} {sortedCollectors.length === 1 ? "collector" : "collectors"} found
        </span>
      </FilterBar>

      {/* Table Container */}
      {sortedCollectors.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-5 h-5 text-[#8A8A85]" />}
          title="No collectors found"
          description={
            hasActiveFilters
              ? "No collectors match the current filter criteria. Try resetting your search or filters."
              : "No collectors registered on the platform yet."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" className="rounded-xl px-5" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8E8E3] shadow-soft-sm overflow-hidden">
            <Table className="border-none">
              <TableHeader className="bg-[#F2F0ED]/70 border-b border-[#E8E8E3]">
                <tr>
                  <TableHead>
                    <button
                      onClick={() => handleSort("name")}
                      className="group inline-flex items-center gap-1.5 hover:text-[#141413] cursor-pointer"
                    >
                      <span>Collector</span>
                      {renderSortIndicator("name")}
                    </button>
                  </TableHead>
                  <TableHead>
                    <span>Preferences</span>
                  </TableHead>
                  <TableHead>
                    <span>Inquiries Raised</span>
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
                {paginatedCollectors.map((collector) => (
                  <TableRow
                    key={collector.id}
                    onClick={() => handleRowClick(collector)}
                    className="cursor-pointer hover:bg-[#F2F0ED]/40 transition-colors"
                  >
                    {/* Collector Name */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#000000] border border-black flex items-center justify-center text-xs font-medium text-white shrink-0 overflow-hidden">
                          {collector.profilePicUrl ? (
                            <img
                              src={collector.profilePicUrl}
                              alt={collector.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getInitials(collector.name)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[#141413]">
                            {collector.name}
                          </p>
                          <p className="text-[11px] text-[#71716D]">
                            ID: {collector.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* preferences */}
                    <TableCell className="text-[#52524E] font-medium">
                      {collector.preferences || "Contemporary Art"}
                    </TableCell>

                    {/* Interests Raised */}
                    <TableCell>
                      {(() => {
                        const count = inquiryCounts[collector.id] || 0;
                        return count > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#F0F5F1] text-[#28633B] border border-[#CDE3D4]">
                            <Sparkles className="w-3 h-3 text-[#28633B]" />
                            {count} {count === 1 ? "Artwork" : "Artworks"}
                          </span>
                        ) : (
                          <span className="text-xs text-[#8A8A85]">None yet</span>
                        );
                      })()}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant={
                          collector.status === "active"
                            ? "success"
                            : collector.status === "pending"
                            ? "warning"
                            : "danger"
                        }
                        size="sm"
                        dot
                        className="rounded-md capitalize font-medium"
                      >
                        {collector.status}
                      </Badge>
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell className="text-xs text-[#6E6E69]">
                      {formatDate(collector.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Reusable Pagination */}
          <Pagination
            currentPage={currentPage}
            totalItems={sortedCollectors.length}
            pageSize={pageSize}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* Side Drawer: Collector details & actions */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedCollector?.name || "Collector Profile"}
        description="Patron portfolio and acquisition inquiry status"
        footer={
          selectedCollector && (
            <div className="flex items-center justify-between w-full">
              <Button
                variant={
                  selectedCollector.status === "active" ? "outline" : "primary"
                }
                size="sm"
                onClick={handleToggleSuspend}
                isLoading={isUpdating}
                className="rounded-xl px-5"
                leftIcon={
                  selectedCollector.status === "active" ? (
                    <Ban className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )
                }
              >
                {selectedCollector.status === "active"
                  ? "Suspend Patron"
                  : "Revert Suspension"}
              </Button>

              <Link href={`/admin/collectors/${selectedCollector.id}`}>
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-xl px-5"
                >
                  View Full Dossier
                </Button>
              </Link>
            </div>
          )
        }
      >
        {selectedCollector && (
          <div className="space-y-6">
            {/* Header in Drawer */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-[#E8E8E3]">
              <div className="w-12 h-12 rounded-full bg-[#000000] border border-black flex items-center justify-center text-base font-medium text-white shrink-0 overflow-hidden">
                {selectedCollector.profilePicUrl ? (
                  <img
                    src={selectedCollector.profilePicUrl}
                    alt={selectedCollector.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(selectedCollector.name)
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-medium text-[#141413] truncate">
                  {selectedCollector.name}
                </h4>
                <p className="text-xs text-[#6E6E69] truncate">
                  Patron & Collector
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Badge
                    variant={
                      selectedCollector.status === "active"
                        ? "success"
                        : selectedCollector.status === "pending"
                        ? "warning"
                        : "danger"
                    }
                    size="sm"
                    dot
                    className="rounded-md capitalize font-medium"
                  >
                    {selectedCollector.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Collector Metadata */}
            <div className="space-y-3 text-xs">
              <h5 className="font-medium text-[#1345EE] uppercase tracking-[0.2em] text-[11px] font-sans">
                Patron Dossier
              </h5>

              <div className="flex items-center justify-between py-2.5 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Collector ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#F2F0ED] border border-[#E8E8E3] px-2 py-0.5 rounded-md">
                  {selectedCollector.id}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Art Preferences</span>
                <span className="font-medium text-[#141413]">
                  {selectedCollector.preferences || "Contemporary Art"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 border-b border-[#F0F0EB]">
                <span className="text-[#6E6E69]">Registered Date</span>
                <span className="font-medium text-[#141413]">
                  {formatDate(selectedCollector.createdAt)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
