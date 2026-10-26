"use client";

import React, { useState, useMemo, useEffect, useTransition } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  X,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Archive,
  Palette,
  Eye,
  EyeOff,
  Star,
  Check,
  Loader2,
  ExternalLink,
  Tag,
  Maximize2,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  MinusSquare,
  Sparkles,
  Flag,
} from "lucide-react";
import { TriangleAlertIcon, SaveIcon } from "@/components/ui/icons";
import { Artwork, ArtworkStatus, Creator } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui";
import {
  updateArtworkAction,
  bulkUpdateArtworksAction,
  deleteArtworkAction,
  createArtworkAction,
  createReportAction,
} from "@/app/admin/actions";
import { AdminUserLink } from "@/components/admin/AdminUserLink";
import { ExportDropdown } from "@/components/admin/ExportDropdown";
import { ArtworkUploadForm } from "@/components/artworks/ArtworkUploadForm";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";

interface ArtworksClientProps {
  initialArtworks: Artwork[];
  distinctCreators: string[];
  distinctMedia: string[];
  creators?: Creator[];
}

type ViewMode = "grid" | "table";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
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

function getInitials(name: string): string {
  if (!name) return "A";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ArtworksClient({
  initialArtworks,
  distinctCreators,
  distinctMedia,
  creators = [],
}: ArtworksClientProps) {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get("status") || "all";

  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [viewingArtwork, setViewingArtwork] = useState<Artwork | null>(null);

  // Sync direct URL view parameter if present
  useEffect(() => {
    const viewId = searchParams.get("view");
    if (viewId) {
      const match = artworks.find((a) => a.id === viewId);
      if (match) setViewingArtwork(match);
    }
  }, [searchParams, artworks]);

  // Search & Filters
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatusParam);
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [mediumFilter, setMediumFilter] = useState("all");

  // Sorting & Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail Drawer state
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Reject with reason state
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Edit inline state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editMedium, setEditMedium] = useState("");
  const [editDimensions, setEditDimensions] = useState("");

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Artwork modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Report Artwork Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Possible copyright infringement");
  const [reportDetails, setReportDetails] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingArtwork) return;
    setIsSubmittingReport(true);
    try {
      const res = await createReportAction({
        artworkId: viewingArtwork.id,
        reason: reportReason,
        details: reportDetails,
        reporterName: "You (Community Member)",
      });
      if (res.success) {
        toast.success(
          "Report submitted",
          `Thank you. Your report regarding "${viewingArtwork.title}" has been submitted for moderation.`
        );
        setIsReportModalOpen(false);
        setReportDetails("");
      } else {
        toast.error("Failed to submit report", res.error || "Please try again.");
      }
    } catch {
      toast.error("Network error", "Could not submit report.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Debounce search query (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync URL search params
  useEffect(() => {
    const param = searchParams.get("status");
    if (param) {
      setStatusFilter(param);
    }
  }, [searchParams]);

  // Sync drawer edit form
  useEffect(() => {
    if (selectedArtwork) {
      setEditTitle(selectedArtwork.title);
      setEditPrice(String(selectedArtwork.price || 0));
      setEditMedium(selectedArtwork.medium || "");
      setEditDimensions(selectedArtwork.dimensions || "");
      setShowRejectForm(false);
      setRejectReason("");
      setIsEditing(false);
    }
  }, [selectedArtwork]);

  // Client-side Filtering
  const filteredArtworks = useMemo(() => {
    return artworks.filter((art) => {
      // Search by title, creator, or medium
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchesTitle = art.title.toLowerCase().includes(q);
        const matchesCreator = art.creatorName.toLowerCase().includes(q);
        const matchesMedium = art.medium.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCreator && !matchesMedium) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "all" && art.status !== statusFilter) {
        return false;
      }

      // Creator
      if (creatorFilter !== "all" && art.creatorName !== creatorFilter) {
        return false;
      }

      // Medium
      if (
        mediumFilter !== "all" &&
        !art.medium.toLowerCase().includes(mediumFilter.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [artworks, debouncedSearch, statusFilter, creatorFilter, mediumFilter]);

  // Pagination slice
  const totalPages = Math.ceil(filteredArtworks.length / pageSize) || 1;
  const paginatedArtworks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredArtworks.slice(start, start + pageSize);
  }, [filteredArtworks, currentPage, pageSize]);

  // Status Badge Component
  const renderStatusBadge = (status: ArtworkStatus) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EAF2EC] text-[#28633B] border border-[#D4E6D8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#28633B]" />
            Published
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FAF5EC] text-[#865E16] border border-[#ECDDBB]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
            Pending
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F3F3EF] text-[#71716D] border border-[#E5E5DF]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#71716D]" />
            Draft
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FDF3F2] text-[#B83838] border border-[#F4CDCD]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B83838]" />
            Rejected
          </span>
        );
    }
  };

  // Open Drawer Handler
  const openDetailDrawer = (art: Artwork) => {
    setSelectedArtwork(art);
    setIsDrawerOpen(true);
  };

  // Status Change (Optimistic)
  const handleUpdateStatus = async (nextStatus: ArtworkStatus) => {
    if (!selectedArtwork) return;
    const artTitle = selectedArtwork.title;
    const previous = { ...selectedArtwork };
    const updated = { ...selectedArtwork, status: nextStatus };

    setSelectedArtwork(updated);
    setArtworks((prev) =>
      prev.map((a) => (a.id === selectedArtwork.id ? updated : a))
    );
    setShowRejectForm(false);

    setIsActionLoading(true);
    try {
      const res = await updateArtworkAction(selectedArtwork.id, {
        status: nextStatus,
      });
      if (!res.success) {
        setSelectedArtwork(previous);
        setArtworks((prev) =>
          prev.map((a) => (a.id === selectedArtwork.id ? previous : a))
        );
        toast.error("Failed to update status", res.error || "Please try again.");
      } else {
        toast.success(
          "Status updated",
          `"${artTitle}" marked as ${nextStatus}.`
        );
      }
    } catch {
      setSelectedArtwork(previous);
      setArtworks((prev) =>
        prev.map((a) => (a.id === selectedArtwork.id ? previous : a))
      );
      toast.error("Network error", "Could not update artwork status.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Save Edits
  const handleSaveEdits = async () => {
    if (!selectedArtwork) return;
    const parsedPrice = parseFloat(editPrice) || selectedArtwork.price;
    const previous = { ...selectedArtwork };
    const updated: Artwork = {
      ...selectedArtwork,
      title: editTitle.trim() || selectedArtwork.title,
      price: parsedPrice,
      medium: editMedium.trim() || selectedArtwork.medium,
      dimensions: editDimensions.trim() || selectedArtwork.dimensions,
    };

    setSelectedArtwork(updated);
    setArtworks((prev) =>
      prev.map((a) => (a.id === selectedArtwork.id ? updated : a))
    );
    setIsEditing(false);

    setIsActionLoading(true);
    try {
      const res = await updateArtworkAction(selectedArtwork.id, {
        title: updated.title,
        price: updated.price,
        medium: updated.medium,
        dimensions: updated.dimensions,
      });
      if (!res.success) {
        setSelectedArtwork(previous);
        setArtworks((prev) =>
          prev.map((a) => (a.id === selectedArtwork.id ? previous : a))
        );
        toast.error("Failed to save changes", res.error || "Please try again.");
      } else {
        toast.success("Artwork updated", "Changes saved successfully.");
      }
    } catch {
      setSelectedArtwork(previous);
      setArtworks((prev) =>
        prev.map((a) => (a.id === selectedArtwork.id ? previous : a))
      );
      toast.error("Network error", "Could not save artwork changes.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete Artwork
  const handleConfirmDelete = async () => {
    if (!selectedArtwork) return;
    const targetId = selectedArtwork.id;
    const artTitle = selectedArtwork.title;
    const previous = [...artworks];

    setArtworks((prev) => prev.filter((a) => a.id !== targetId));
    setIsDeleteModalOpen(false);
    setIsDrawerOpen(false);
    setSelectedArtwork(null);

    setIsDeleting(true);
    try {
      const res = await deleteArtworkAction(targetId);
      if (!res.success) {
        setArtworks(previous);
        toast.error("Failed to delete artwork", res.error || "Please try again.");
      } else {
        toast.success("Artwork deleted", `"${artTitle}" removed permanently.`);
      }
    } catch {
      setArtworks(previous);
      toast.error("Network error", "Could not delete artwork.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle Featured status
  const handleToggleFeature = async (art: Artwork) => {
    const nextVal = !art.isFeatured;
    const previous = [...artworks];

    // Optimistic UI update
    setArtworks((prev) =>
      prev.map((a) => (a.id === art.id ? { ...a, isFeatured: nextVal } : a))
    );
    if (viewingArtwork?.id === art.id) {
      setViewingArtwork((prev) => (prev ? { ...prev, isFeatured: nextVal } : null));
    }

    try {
      const res = await updateArtworkAction(art.id, { isFeatured: nextVal });
      if (!res.success) {
        setArtworks(previous);
        if (viewingArtwork?.id === art.id) {
          setViewingArtwork((prev) => (prev ? { ...prev, isFeatured: !nextVal } : null));
        }
        toast.error("Failed to update featured status", res.error || "Please try again.");
      } else {
        toast.success(
          nextVal ? "Artwork featured" : "Artwork unfeatured",
          `"${art.title}" ${nextVal ? "featured on platform" : "unfeatured"}.`
        );
      }
    } catch {
      setArtworks(previous);
      if (viewingArtwork?.id === art.id) {
        setViewingArtwork((prev) => (prev ? { ...prev, isFeatured: !nextVal } : null));
      }
      toast.error("Network Error", "Could not update featured status.");
    }
  };

  // Toggle Visibility (Published / Draft)
  const handleToggleHide = async (art: Artwork) => {
    const nextStatus: ArtworkStatus = (art.status === "draft" || art.status === "rejected") ? "published" : "draft";
    const previous = [...artworks];

    // Optimistic UI update
    setArtworks((prev) =>
      prev.map((a) => (a.id === art.id ? { ...a, status: nextStatus } : a))
    );
    if (viewingArtwork?.id === art.id) {
      setViewingArtwork((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }

    try {
      const res = await updateArtworkAction(art.id, { status: nextStatus });
      if (!res.success) {
        setArtworks(previous);
        if (viewingArtwork?.id === art.id) {
          setViewingArtwork((prev) => (prev ? { ...prev, status: art.status } : null));
        }
        toast.error("Failed to update visibility", res.error || "Please try again.");
      } else {
        toast.success(
          nextStatus === "draft" ? "Artwork hidden" : "Visibility reverted",
          `"${art.title}" is now ${nextStatus === "draft" ? "hidden (draft)" : "visible (reverted)"}.`
        );
      }
    } catch {
      setArtworks(previous);
      if (viewingArtwork?.id === art.id) {
        setViewingArtwork((prev) => (prev ? { ...prev, status: art.status } : null));
      }
      toast.error("Network Error", "Could not update artwork visibility.");
    }
  };

  // Toggle Flagged status
  const handleToggleFlag = async (art: Artwork) => {
    const nextVal = !art.isFlagged;
    const previous = [...artworks];

    setArtworks((prev) =>
      prev.map((a) => (a.id === art.id ? { ...a, isFlagged: nextVal } : a))
    );
    if (viewingArtwork?.id === art.id) {
      setViewingArtwork((prev) => (prev ? { ...prev, isFlagged: nextVal } : null));
    }

    try {
      const res = await updateArtworkAction(art.id, { isFlagged: nextVal });
      if (!res.success) {
        setArtworks(previous);
        if (viewingArtwork?.id === art.id) {
          setViewingArtwork((prev) => (prev ? { ...prev, isFlagged: !nextVal } : null));
        }
        toast.error("Failed to update flag", res.error || "Please try again.");
      } else {
        toast.info(
          nextVal ? "Artwork flagged" : "Flag cleared",
          `"${art.title}" ${nextVal ? "flagged for review" : "unflagged"}.`
        );
      }
    } catch {
      setArtworks(previous);
      if (viewingArtwork?.id === art.id) {
        setViewingArtwork((prev) => (prev ? { ...prev, isFlagged: !nextVal } : null));
      }
      toast.error("Network Error", "Could not update flagged status.");
    }
  };

  // Bulk Actions
  const handleToggleSelectAll = () => {
    if (selectedIds.size === paginatedArtworks.length && paginatedArtworks.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedArtworks.map((a) => a.id)));
    }
  };

  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkUpdateStatus = async (status: "published" | "rejected") => {
    if (selectedIds.size === 0) return;
    const targetIds = Array.from(selectedIds);
    const count = targetIds.length;
    const previous = [...artworks];

    setArtworks((prev) =>
      prev.map((a) => (selectedIds.has(a.id) ? { ...a, status } : a))
    );
    setSelectedIds(new Set());

    try {
      const res = await bulkUpdateArtworksAction(targetIds, { status });
      if (!res.success) {
        setArtworks(previous);
        toast.error("Bulk action failed", res.error || "Could not complete update.");
      } else {
        toast.success("Bulk update complete", `${count} artworks updated to ${status}.`);
      }
    } catch {
      setArtworks(previous);
      toast.error("Network error", "Could not complete bulk update.");
    }
  };

  const hasActiveFilters =
    Boolean(debouncedSearch) ||
    statusFilter !== "all" ||
    creatorFilter !== "all" ||
    mediumFilter !== "all";

  const handleResetFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setCreatorFilter("all");
    setMediumFilter("all");
    setCurrentPage(1);
  };

  const statusPills: { label: string; value: string }[] = [
    { label: "All", value: "all" },
    { label: "Published", value: "published" },
    { label: "Pending", value: "pending" },
    { label: "Draft", value: "draft" },
    { label: "Rejected", value: "rejected" },
  ];

  // If viewing an artwork detail (Discovery view matching Screenshot 2)
  if (viewingArtwork) {
    return (
      <div className="space-y-6 pb-16 animate-in fade-in duration-150">
        {/* Top-left: Back to discovery button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setViewingArtwork(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E8E8E3] bg-white text-xs uppercase tracking-[0.08em] font-medium text-[#141413] hover:bg-[#FAF5EC] hover:border-[#141413] transition-colors shadow-soft-sm cursor-pointer select-none"
          >
            <span>←</span>
            <span>Back to gallery</span>
          </button>
        </div>

        {/* 2-Column Discovery Detail Layout matching Eras Studio aesthetic */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start max-w-6xl mx-auto pt-2">
          {/* Left Column: Artwork Image framed in soft canvas container */}
          <div className="lg:col-span-6 bg-[#FAF5EC] p-6 sm:p-10 md:p-12 rounded-2xl border border-[#E8E8E3] shadow-soft-sm flex items-center justify-center">
            <div className="relative w-full aspect-4/5 max-w-md rounded-2xl overflow-hidden shadow-soft-md bg-white border border-[#E8E8E3]">
              <Image
                src={viewingArtwork.imageUrl}
                alt={viewingArtwork.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Right Column: Metadata, Specifications & Actions */}
          <div className="lg:col-span-6 space-y-5 pt-1 bg-white p-6 sm:p-8 rounded-2xl border border-[#E8E8E3] shadow-soft-sm">
            {/* Category / Year */}
            <p className="text-xs uppercase tracking-[0.1em] text-[#865E16] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
              {viewingArtwork.medium} / {viewingArtwork.year || "2026"}
            </p>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-serif text-[#141413] tracking-tight leading-tight">
              {viewingArtwork.title}
            </h1>

            {/* Creator Byline */}
            <div className="pt-1">
              <AdminUserLink
                userId={viewingArtwork.creatorId}
                name={viewingArtwork.creatorName}
                role="Creator"
                avatar={null as any}
                className="text-sm font-medium"
              />
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#71716D] leading-relaxed font-normal pt-1">
              {viewingArtwork.description ||
                "A curated study of changing light across landscapes. Layered forms reveal fragments of memory and a quieter way of seeing."}
            </p>

            {/* Specifications Table */}
            <div className="border-t border-b border-[#E8E8E3] divide-y divide-[#E8E8E3] text-xs sm:text-sm my-6">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#71716D]">Medium</span>
                <span className="text-[#141413] font-medium">{viewingArtwork.medium}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#71716D]">Dimensions</span>
                <span className="text-[#141413] font-medium">{viewingArtwork.dimensions}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#71716D]">Year</span>
                <span className="text-[#141413] font-medium">{viewingArtwork.year || "2026"}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#71716D]">Location</span>
                <span className="text-[#141413] font-medium">{viewingArtwork.location || "Mumbai"}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#71716D]">Collection</span>
                <span className="text-[#141413] font-medium">
                  {viewingArtwork.collection || "Monsoon Studies"}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-[#71716D]">Availability</span>
                <span className="text-[#141413] font-medium">
                  {viewingArtwork.availability ||
                    (viewingArtwork.status === "published" ? "Available" : "Not for sale")}
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="pt-1">
              <p className="text-xl font-serif font-bold text-[#141413]">
                {viewingArtwork.price > 0
                  ? formatCurrency(viewingArtwork.price)
                  : "Price on request"}
              </p>
            </div>

            {/* Actions Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <Button
                variant="danger"
                size="sm"
                className="rounded-full inline-flex items-center justify-center gap-2"
                onClick={() => {
                  setSelectedArtwork(viewingArtwork);
                  setIsDeleteModalOpen(true);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </Button>

              <Button
                variant={viewingArtwork.isFeatured ? "primary" : "outline"}
                size="sm"
                className="rounded-full inline-flex items-center justify-center gap-2"
                onClick={() => handleToggleFeature(viewingArtwork)}
              >
                <Star className={`w-3.5 h-3.5 ${viewingArtwork.isFeatured ? "fill-current" : ""}`} />
                {viewingArtwork.isFeatured ? "Featured" : "Feature"}
              </Button>

              <Button
                variant={viewingArtwork.status === "draft" || viewingArtwork.status === "rejected" ? "outline" : "outline"}
                size="sm"
                className={`rounded-full inline-flex items-center justify-center gap-2 ${
                  viewingArtwork.status === "draft" || viewingArtwork.status === "rejected"
                    ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    : ""
                }`}
                onClick={() => handleToggleHide(viewingArtwork)}
              >
                {viewingArtwork.status === "draft" || viewingArtwork.status === "rejected" ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Revert (Unhide)</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    Hide
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* User-side Report Artwork Modal */}
        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <TriangleAlertIcon size={20} strokeWidth={2} className="text-amber-500" />
              <span>Report Artwork</span>
            </div>
          }
          description="Help keep the ErasStudio creative community safe, authentic, and respectful."
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitReport}
                isLoading={isSubmittingReport}
              >
                Submit Report
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                Reason for report *
              </label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#141413]"
              >
                <option value="Possible copyright infringement">Possible copyright infringement</option>
                <option value="Inappropriate content">Inappropriate content</option>
                <option value="Incorrect artwork information">Incorrect artwork information</option>
                <option value="Harassment or offensive content">Harassment or offensive content</option>
                <option value="Spam or misleading content">Spam or misleading content</option>
                <option value="Fraud or scam">Fraud or scam</option>
                <option value="Stolen artwork">Stolen artwork</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#141413] mb-1.5">
                Additional details (optional)
              </label>
              <textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                placeholder="Provide any relevant context, links, or evidence to assist our moderation team..."
                rows={3}
                className="w-full text-xs p-3 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#141413]"
              />
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. MAIN HEADER & ADD ARTWORK ACTION */}
      {/* ========================================================================= */}
      <div className="border-b border-[#E8E8E3] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
              <span className="text-[11px] uppercase tracking-[0.14em] font-medium text-[#71716D]">
                Curatorial Catalog & Moderation
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#141413] tracking-tight">
              Curatorial Gallery<span className="italic font-normal">.</span>
            </h1>
            <p className="mt-1 text-xs md:text-sm text-[#71716D] font-light">
              Catalog of creator submissions, editorial features, medium specifications, and publication review.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* View Mode Switcher */}
            <div className="inline-flex items-center p-1 rounded-full border border-[#E8E8E3] bg-white shadow-soft-sm">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                className={`p-1.5 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "grid"
                    ? "bg-[#141413] text-white shadow-soft-sm"
                    : "text-[#71716D] hover:text-[#141413]"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-label="Table view"
                className={`p-1.5 px-3 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === "table"
                    ? "bg-[#141413] text-white shadow-soft-sm"
                    : "text-[#71716D] hover:text-[#141413]"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Table</span>
              </button>
            </div>

            <ExportDropdown exportType="artworks" filters={{ query: debouncedSearch, status: statusFilter === "all" ? undefined : statusFilter, creatorName: creatorFilter === "all" ? undefined : creatorFilter }} />

            {/* + Add Artwork Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#141413] text-white text-xs uppercase tracking-[0.08em] font-medium hover:bg-[#2A2A28] active:bg-[#000000] transition-colors shadow-soft-sm cursor-pointer select-none"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Artwork</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH & FILTER BAR (Eras Studio Design System) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#E8E8E3] p-4 shadow-soft-sm space-y-3">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#8A8A85] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search artworks by title, creator, or medium..."
            className="w-full text-xs md:text-sm pl-10 pr-9 py-2.5 rounded-full border border-[#E8E8E3] bg-[#FAF5EC]/40 focus:bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#865E16] focus:ring-1 focus:ring-[#865E16] transition-all shadow-2xs"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setDebouncedSearch("");
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8A85] hover:text-[#141413] p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Row: Status Pills + Dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {statusPills.map((pill) => {
              const isActive = statusFilter === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(pill.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer select-none ${
                    isActive
                      ? "bg-[#141413] text-white shadow-soft-sm"
                      : "bg-white text-[#71716D] border border-[#E8E8E3] hover:text-[#141413] hover:border-[#141413]"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          {/* Creators & Media Dropdowns */}
          <div className="flex items-center gap-2">
            {/* Medium Dropdown */}
            <select
              value={mediumFilter}
              onChange={(e) => {
                setMediumFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by medium"
              className="text-xs px-3 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-[#141413] focus:outline-none focus:border-[#865E16] cursor-pointer"
            >
              <option value="all">All Media</option>
              {distinctMedia.map((medium) => (
                <option key={medium} value={medium}>
                  {medium}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[#865E16] hover:text-[#141413] font-medium px-2 py-1 cursor-pointer"
              >
                Reset
              </button>
            )}

            <span className="text-xs text-[#8A8A85] pl-2 border-l border-[#E8E8E3] hidden sm:inline">
              {filteredArtworks.length} {filteredArtworks.length === 1 ? "artwork" : "artworks"}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BULK ACTION BAR (Table mode) */}
      {/* ========================================================================= */}
      {viewMode === "table" && selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 px-4 bg-[#FAF5EC] border border-[#ECDDBB] rounded-2xl shadow-soft-sm animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-medium text-[#141413]">
            <CheckSquare className="w-4 h-4 text-[#865E16]" />
            <span>
              {selectedIds.size} {selectedIds.size === 1 ? "artwork" : "artworks"} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setSelectedIds(new Set())}
            >
              Deselect All
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="rounded-full"
              onClick={() => handleBulkUpdateStatus("published")}
              leftIcon={<Check className="w-3.5 h-3.5" />}
            >
              Approve All
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="rounded-full"
              onClick={() => handleBulkUpdateStatus("rejected")}
              leftIcon={<X className="w-3.5 h-3.5" />}
            >
              Reject All
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CONTENT RENDERING: EMPTY STATE, GRID OR TABLE */}
      {/* ========================================================================= */}
      {filteredArtworks.length === 0 ? (
        <EmptyState
          icon={<Palette className="w-6 h-6 text-[#8A8A85]" />}
          title="No artworks found"
          description={
            hasActiveFilters
              ? "No artwork matches your active search or filter criteria. Try adjusting or clearing your filters."
              : "No artwork has been submitted to the catalog yet."
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add First Artwork
              </Button>
            )
          }
        />
      ) : viewMode === "grid" ? (
        /* ===================================================================== */
        /* GRID VIEW: Clean, Compact ERAS Studio Artwork Cards                   */
        /* ===================================================================== */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedArtworks.map((art) => (
              <div
                key={art.id}
                onClick={() => setViewingArtwork(art)}
                className="group bg-white border border-[#E8E8E3] hover:border-[#141413] rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 shadow-soft-sm hover:shadow-soft-md"
              >
                {/* Fixed Dimension Image Container with Next.js Optimization */}
                <div className="relative aspect-4/3 w-full bg-[#FAF5EC] overflow-hidden">
                  <Image
                    src={art.imageUrl}
                    alt={art.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    loading="lazy"
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  {/* Subtle Status Pill */}
                  <div className="absolute top-2.5 right-2.5">
                    {renderStatusBadge(art.status)}
                  </div>

                  {/* Subtle Hover Action Pill */}
                  <div className="absolute inset-0 bg-[#141413]/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-[#141413] text-[11px] uppercase tracking-[0.06em] font-medium shadow-soft-sm backdrop-blur-xs">
                      <Eye className="w-3 h-3 text-[#865E16]" />
                      <span>View Specs</span>
                    </span>
                  </div>
                </div>

                {/* Card Text Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <h4 className="text-sm font-serif font-semibold text-[#141413] group-hover:text-[#865E16] transition-colors truncate">
                      {art.title}
                    </h4>
                    <p className="text-xs text-[#71716D] truncate mt-0.5">
                      by <span className="font-medium text-[#141413]">{art.creatorName}</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F0F0EB] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#71716D] truncate max-w-[120px]">
                      {art.medium}
                    </span>
                    <span className="font-serif font-semibold text-[#141413]">
                      {art.price ? formatCurrency(art.price) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E8E8E3]">
            <span className="text-xs text-[#71716D]">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredArtworks.length)}–
              {Math.min(currentPage * pageSize, filteredArtworks.length)} of {filteredArtworks.length} artworks
            </span>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredArtworks.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      ) : (
        /* ===================================================================== */
        /* TABLE VIEW (Alternative view mode)                                    */
        /* ===================================================================== */
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#E8E8E3] bg-white overflow-hidden shadow-soft-sm">
            <Table>
              <TableHeader>
                <tr className="bg-[#FAF5EC]/60 border-b border-[#E8E8E3]">
                  <TableHead className="w-10">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-[#71716D] hover:text-[#141413] cursor-pointer"
                      aria-label="Select all on this page"
                    >
                      {selectedIds.size === paginatedArtworks.length && paginatedArtworks.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-[#865E16]" />
                      ) : selectedIds.size > 0 ? (
                        <MinusSquare className="w-4 h-4 text-[#865E16]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.08em] text-[#71716D] font-medium">Artwork</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.08em] text-[#71716D] font-medium">Artist</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.08em] text-[#71716D] font-medium">Medium</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.08em] text-[#71716D] font-medium">Availability</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.08em] text-[#71716D] font-medium">Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-[0.08em] text-[#71716D] font-medium">Status</TableHead>
                  <TableHead className="text-right pr-6 text-xs uppercase tracking-[0.08em] text-[#71716D] font-medium">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {paginatedArtworks.map((art) => {
                  const isSelected = selectedIds.has(art.id);
                  return (
                    <TableRow
                      key={art.id}
                      onClick={() => setViewingArtwork(art)}
                      className="cursor-pointer hover:bg-[#FAF5EC]/40 transition-colors border-b border-[#F0F0EB] last:border-0"
                    >
                      <TableCell onClick={(e) => handleToggleSelectRow(art.id, e)}>
                        <button
                          type="button"
                          className="text-[#71716D] hover:text-[#141413] cursor-pointer flex items-center"
                          aria-label={`Select ${art.title}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#865E16]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-12 h-12 rounded-xl bg-[#FAF5EC] overflow-hidden shrink-0 border border-[#E8E8E3]">
                            <Image
                              src={art.imageUrl}
                              alt={art.title}
                              fill
                              sizes="48px"
                              loading="lazy"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-serif font-semibold text-sm text-[#141413] whitespace-nowrap block">
                              {art.title}
                            </span>
                            <span className="text-xs text-[#71716D] font-serif">
                              {art.price ? formatCurrency(art.price) : "—"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm text-[#141413] whitespace-nowrap">
                        {art.creatorName}
                      </TableCell>

                      <TableCell className="text-xs text-[#71716D] whitespace-nowrap">
                        {art.medium}
                      </TableCell>

                      <TableCell className="text-xs text-[#141413] whitespace-nowrap">
                        {art.availability || (art.status === "published" ? "Available" : "Not for sale")}
                      </TableCell>

                      <TableCell className="text-xs text-[#71716D] whitespace-nowrap">
                        {formatDate(art.createdAt)}
                      </TableCell>

                      <TableCell>
                        {renderStatusBadge(art.status)}
                      </TableCell>

                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingArtwork(art)}
                            className="px-3 py-1 rounded-full border border-[#E8E8E3] text-xs font-medium text-[#141413] bg-white hover:bg-[#FAF5EC] transition-colors cursor-pointer select-none"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleFeature(art)}
                            className="px-3 py-1 rounded-full border border-[#E8E8E3] text-xs font-medium text-[#141413] bg-white hover:bg-[#FAF5EC] transition-colors cursor-pointer select-none"
                          >
                            {art.isFeatured ? "Unfeature" : "Feature"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleHide(art)}
                            className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer select-none ${
                              art.status === "published"
                                ? "border-[#E8E8E3] text-[#141413] bg-white hover:bg-[#FAF5EC]"
                                : "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-medium"
                            }`}
                          >
                            {art.status === "published" ? "Hide" : "Revert"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedArtwork(art);
                              setIsDeleteModalOpen(true);
                            }}
                            className="px-3 py-1 rounded-full border border-[#E8E8E3] text-xs font-medium text-[#9E3333] bg-white hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer select-none"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleFlag(art)}
                            className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer select-none ${
                              art.isFlagged
                                ? "bg-amber-50 text-amber-700 border-amber-300"
                                : "border-[#E8E8E3] text-[#71716D] bg-white hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                            }`}
                          >
                            {art.isFlagged ? "Flagged" : "Flag"}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E8E8E3]">
            <span className="text-xs text-[#71716D]">
              Showing {Math.min((currentPage - 1) * pageSize + 1, filteredArtworks.length)}–
              {Math.min(currentPage * pageSize, filteredArtworks.length)} of {filteredArtworks.length} artworks
            </span>
            <Pagination
              currentPage={currentPage}
              totalItems={filteredArtworks.length}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. RIGHT DETAIL DRAWER (Eras Studio Design Language)                      */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedArtwork?.title || "Artwork Detail"}
        description="Curatorial review, valuation, and publication status"
        maxWidth="lg"
        footer={
          selectedArtwork && (
            <div className="flex items-center justify-between w-full">
              <Button
                variant="danger"
                size="sm"
                className="rounded-full"
                onClick={() => setIsDeleteModalOpen(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Delete
              </Button>

              <div className="flex items-center gap-2">
                {selectedArtwork.status === "published" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleUpdateStatus("draft")}
                    isLoading={isActionLoading}
                    leftIcon={<Archive className="w-3.5 h-3.5" />}
                  >
                    Unpublish
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleUpdateStatus("published")}
                    isLoading={isActionLoading}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Approve / Publish
                  </Button>
                )}

                {selectedArtwork.status !== "rejected" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setShowRejectForm((prev) => !prev)}
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Reject
                  </Button>
                )}
              </div>
            </div>
          )
        }
      >
        {selectedArtwork && (
          <div className="space-y-6">
            {/* Artwork Image Container */}
            <div className="relative aspect-16/10 w-full rounded-2xl bg-[#FAF5EC] overflow-hidden border border-[#E8E8E3]">
              <Image
                src={selectedArtwork.imageUrl}
                alt={selectedArtwork.title}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
                priority
              />
              <div className="absolute top-3 right-3">
                {renderStatusBadge(selectedArtwork.status)}
              </div>
            </div>

            {/* Title, Creator & Price Header */}
            <div className="p-4 bg-white border border-[#E8E8E3] rounded-2xl shadow-soft-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-base font-serif font-semibold text-[#141413]">
                    {selectedArtwork.title}
                  </h4>
                  <p className="text-xs text-[#71716D] mt-0.5">
                    by <span className="font-medium text-[#141413]">{selectedArtwork.creatorName}</span>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-serif font-semibold text-[#141413]">
                    {selectedArtwork.price ? formatCurrency(selectedArtwork.price) : "Price on request"}
                  </span>
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditing((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-[11px] text-[#865E16] hover:text-[#141413] font-medium cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditing ? "Close Edit" : "Edit Details"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Inline Edit Form */}
              {isEditing && (
                <div className="pt-3 border-t border-[#E8E8E3] space-y-3 animate-in fade-in duration-150">
                  <Input
                    label="Artwork Title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Price (USD)"
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                    />
                    <Input
                      label="Medium"
                      value={editMedium}
                      onChange={(e) => setEditMedium(e.target.value)}
                    />
                  </div>
                  <Input
                    label="Physical Dimensions"
                    value={editDimensions}
                    onChange={(e) => setEditDimensions(e.target.value)}
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="rounded-full"
                      onClick={handleSaveEdits}
                      isLoading={isActionLoading}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Rejection Form */}
            {showRejectForm && (
              <div className="p-4 rounded-2xl bg-[#FDF2F2] border border-[#F2C6C6] space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#9E3333] flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-[#B83838]" />
                    <span>Reject Submission</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    className="text-[#9E3333] hover:text-[#141413] text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[11px] text-[#9E3333]/90 leading-relaxed">
                  Provide curatorial feedback explaining why this submission does not meet studio standards.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Dimensions not adhering to gallery specifications / low resolution imagery..."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-white border border-[#F2C6C6] rounded-xl focus:outline-none focus:border-[#B83838] focus:ring-1 focus:ring-[#B83838]"
                />
                <div className="flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    className="rounded-full"
                    onClick={() => handleUpdateStatus("rejected")}
                    isLoading={isActionLoading}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            )}

            {/* Specifications Section */}
            <div className="p-4 bg-white border border-[#E8E8E3] rounded-2xl shadow-soft-sm space-y-3 text-xs">
              <h5 className="font-semibold text-[#141413] uppercase tracking-[0.1em] text-[11px] text-[#71716D]">
                Specifications
              </h5>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#71716D]">Artwork ID</span>
                <span className="font-mono text-[11px] text-[#141413] bg-[#FAF5EC] px-2 py-0.5 rounded-full border border-[#E8E8E3]">
                  {selectedArtwork.id}
                </span>
              </div>

              {selectedArtwork.creatorId && (
                <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                  <span className="text-[#71716D]">Creator ID</span>
                  <span className="font-mono text-[11px] text-[#141413] bg-[#FAF5EC] px-2 py-0.5 rounded-full border border-[#E8E8E3]">
                    {selectedArtwork.creatorId}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#71716D]">Medium</span>
                <span className="font-medium text-[#141413]">
                  {selectedArtwork.medium}
                </span>
              </div>

              {selectedArtwork.dimensions && (
                <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                  <span className="text-[#71716D]">Physical Dimensions</span>
                  <span className="font-medium text-[#141413]">
                    {selectedArtwork.dimensions}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#71716D]">Submitted Date</span>
                <span className="font-medium text-[#141413]">
                  {formatDate(selectedArtwork.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-[#F0F0EB]">
                <span className="text-[#71716D]">Catalog Availability</span>
                <span className="font-medium text-[#141413]">
                  {selectedArtwork.status === "published" ? "Available for collectors" : "Restricted / Internal"}
                </span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ========================================================================= */}
      {/* 6. ADD ARTWORK MODAL (UNIFIED CREATOR UPLOAD ARCHITECTURE)                */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Artwork to Catalog"
        description="Register a new curated piece with media specifications and publication status."
        maxWidth="2xl"
      >
        <ArtworkUploadForm
          mode="admin"
          creators={creators}
          onSuccess={(newArtwork: any) => {
            setArtworks((prev) => [newArtwork, ...prev]);
            setIsAddModalOpen(false);
          }}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* ========================================================================= */}
      {/* 7. DELETE CONFIRMATION MODAL                                             */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete artwork?"
        description="This action cannot be undone."
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              className="rounded-full"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Artwork
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-xs text-[#52524E]">
          <p>
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-[#141413]">
              "{selectedArtwork?.title}"
            </span>{" "}
            by {selectedArtwork?.creatorName}?
          </p>
          <p className="text-[11px] text-[#71716D]">
            This will permanently remove the piece from all exhibitions, collector bookmarks,
            and catalog archives immediately.
          </p>
        </div>
      </Modal>
    </div>
  );
}
