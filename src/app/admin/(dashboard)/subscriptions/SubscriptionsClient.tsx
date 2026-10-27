"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, X, Users, ChevronDown } from "lucide-react";
import { Subscriber, SubscriptionStats } from "@/lib/data/subscriptions";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui";
import { updateUserAction } from "@/app/admin/actions";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";

interface SubscriptionsClientProps {
  initialSubscribers: Subscriber[];
  stats: SubscriptionStats;
}

type PlanFilter = "all" | "featured" | "cor_active" | "free" | "lite" | "pro" | "active" | "suspended";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const PLAN_COLORS: Record<string, string> = {
  Free: "bg-[#F5F5F3] text-[#6E6E69] border-[#E8E8E3]",
  Lite: "bg-[#EEF3FF] text-[#3B5BDB] border-[#C5D8FF]",
  Pro: "bg-[#FFF3E0] text-[#B8532F] border-[#FFDBB3]",
  Elite: "bg-[#FAF0FF] text-[#7048B6] border-[#E5CEFF]",
};

const AVATAR_COLORS = [
  "bg-[#E8F0F5] text-[#2D6A9F]",
  "bg-[#F0EBF8] text-[#6A3D9F]",
  "bg-[#EBF5F0] text-[#2D8A5E]",
  "bg-[#F5EBE8] text-[#9F3D2D]",
  "bg-[#F5F0E8] text-[#8A6D2D]",
  "bg-[#EBF0F5] text-[#3D6A8A]",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function SubscriptionsClient({ initialSubscribers, stats }: SubscriptionsClientProps) {
  const toast = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers);
  const [activeTab, setActiveTab] = useState<PlanFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activePlanDropdownId, setActivePlanDropdownId] = useState<string | null>(null);
  const pageSize = 20;

  useEffect(() => {
    const close = () => setActivePlanDropdownId(null);
    const keyClose = (e: KeyboardEvent) => { if (e.key === "Escape") setActivePlanDropdownId(null); };
    window.addEventListener("click", close);
    window.addEventListener("keydown", keyClose);
    return () => { window.removeEventListener("click", close); window.removeEventListener("keydown", keyClose); };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(searchInput); setCurrentPage(1); }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filtered = useMemo(() => {
    let result = [...subscribers];

    if (activeTab === "featured") result = result.filter((s) => s.isCorMember);
    else if (activeTab === "cor_active") result = result.filter((s) => s.isCorMember && s.status === "active");
    else if (activeTab === "free") result = result.filter((s) => !s.plan || s.plan === "free");
    else if (activeTab === "lite") result = result.filter((s) => (s.plan as string) === "lite");
    else if (activeTab === "pro") result = result.filter((s) => s.plan === "pro" || s.plan === "elite");
    else if (activeTab === "active") result = result.filter((s) => s.status === "active");
    else if (activeTab === "suspended") result = result.filter((s) => s.status === "suspended");

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [subscribers, activeTab, debouncedSearch]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleSuspend = async (sub: Subscriber) => {
    const isCurrentlySuspended = sub.status === "suspended";
    const nextStatus = isCurrentlySuspended ? "active" : "suspended";
    const previous = [...subscribers];
    const next = subscribers.map((s) =>
      s.id === sub.id ? { ...s, status: nextStatus as "active" | "suspended" } : s
    );
    setSubscribers(next);

    try {
      const res = await updateUserAction(sub.id, { status: nextStatus });
      if (!res.success) {
        setSubscribers(previous);
        toast.error(
          isCurrentlySuspended ? "Failed to revert suspension" : "Failed to suspend user",
          res.error || "Please try again."
        );
      } else {
        toast.success(
          isCurrentlySuspended ? "Suspension Reverted" : "User Suspended",
          isCurrentlySuspended
            ? `${sub.name}'s suspension was reverted to active.`
            : `${sub.name}'s account has been suspended.`
        );
      }
    } catch {
      setSubscribers(previous);
      toast.error("Network error", "Could not complete status update.");
    }
  };

  const handleCancelToFree = async (sub: Subscriber) => {
    const previous = [...subscribers];
    const next = subscribers.map((s) =>
      s.id === sub.id ? { ...s, plan: "free" as const } : s
    );
    setSubscribers(next);

    try {
      const res = await updateUserAction(sub.id, { plan: "free" });
      if (!res.success) {
        setSubscribers(previous);
        toast.error("Failed to update plan", res.error || "Please try again.");
      } else {
        toast.success("Plan changed", `${sub.name} has been moved to the Free plan.`);
      }
    } catch {
      setSubscribers(previous);
      toast.error("Network error", "Could not complete plan update.");
    }
  };

  const handlePlanChange = async (sub: Subscriber, newPlan: string) => {
    setActivePlanDropdownId(null);
    const normalizedPlan = newPlan.toLowerCase() as "free" | "pro" | "elite";
    const previous = [...subscribers];
    const next = subscribers.map((s) =>
      s.id === sub.id ? { ...s, plan: normalizedPlan } : s
    );
    setSubscribers(next);

    try {
      const res = await updateUserAction(sub.id, { plan: normalizedPlan });
      if (!res.success) {
        setSubscribers(previous);
        toast.error("Failed to update plan", res.error || "Please try again.");
      } else {
        toast.success("Plan updated", `${sub.name} is now on the ${newPlan} plan.`);
      }
    } catch {
      setSubscribers(previous);
      toast.error("Network error", "Could not complete plan update.");
    }
  };

  const tabs: { key: PlanFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "featured", label: "Featured" },
    { key: "cor_active", label: "COR Active" },
    { key: "free", label: "Free" },
    { key: "lite", label: "Lite" },
    { key: "pro", label: "Pro" },
    { key: "active", label: "Active" },
    { key: "suspended", label: "Suspended" },
  ];

  const planLabel = (plan: string | null | undefined): string => {
    if (!plan || plan === "free") return "Free";
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  return (
    <div className="space-y-7 pb-16 animate-in fade-in duration-150">
      <div className="border-b border-[#E8E8E3] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
          <span className="text-[11px] uppercase tracking-[0.14em] font-medium text-[#71716D]">
            Membership & Privileges
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif text-[#141413] tracking-tight">
          Patronage & Subscriptions<span className="italic font-normal">.</span>
        </h1>
        <p className="mt-1 text-xs md:text-sm text-[#71716D] font-light">
          Platform membership administration, creator tier privileges, and active subscriber ledger.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E8E8E3] rounded-2xl p-5 shadow-soft-sm hover:shadow-soft-md transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.1em] font-medium text-[#71716D]">Free Tier</p>
            <span className="w-2 h-2 rounded-full bg-[#8A8A85]" />
          </div>
          <p className="mt-2 text-4xl font-serif font-semibold text-[#141413]">{stats.freeCount}</p>
          <p className="mt-1.5 text-[11px] text-[#8A8A85]">Standard catalog creators</p>
        </div>
        <div className="bg-white border border-[#E8E8E3] rounded-2xl p-5 shadow-soft-sm hover:shadow-soft-md transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.1em] font-medium text-[#71716D]">Lite Tier</p>
            <span className="w-2 h-2 rounded-full bg-[#3B5BDB]" />
          </div>
          <p className="mt-2 text-4xl font-serif font-semibold text-[#141413]">{stats.liteCount}</p>
          <p className="mt-1.5 text-[11px] text-[#8A8A85]">Emerging talent members</p>
        </div>
        <div className="bg-white border border-[#E8E8E3] rounded-2xl p-5 shadow-soft-sm hover:shadow-soft-md transition-all">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.1em] font-medium text-[#71716D]">Pro & Elite Tier</p>
            <span className="w-2 h-2 rounded-full bg-[#865E16]" />
          </div>
          <p className="mt-2 text-4xl font-serif font-semibold text-[#141413]">{stats.proCount}</p>
          <p className="mt-1.5 text-[11px] text-[#865E16] font-medium">Curated featured creators</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8E8E3] p-4 shadow-soft-sm space-y-3">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#8A8A85] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, location or discipline..."
            className="w-full text-xs md:text-sm pl-11 pr-9 py-2.5 rounded-full border border-[#E8E8E3] bg-[#FAF5EC]/40 focus:bg-white text-[#141413] placeholder:text-[#8A8A85] focus:outline-none focus:border-[#865E16] focus:ring-1 focus:ring-[#865E16] transition-all shadow-2xs"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); setDebouncedSearch(""); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8A85] hover:text-[#141413] p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap select-none ${
                  isActive
                    ? "bg-[#141413] text-white shadow-soft-sm"
                    : "bg-white text-[#71716D] border border-[#E8E8E3] hover:text-[#141413] hover:border-[#141413]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6 text-[#8A8A85]" />}
          title="No subscribers found"
          description="No members match the selected filter or search query."
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8E8E3] overflow-visible shadow-soft-sm">
            <Table containerClassName="overflow-visible border-none bg-transparent">
              <TableHeader>
                <tr className="bg-[#FAF5EC]/60 border-b border-[#E8E8E3]">
                  <TableHead className="py-3.5 pl-6 font-medium text-xs uppercase tracking-[0.08em] text-[#71716D]">Name / Email</TableHead>
                  <TableHead className="py-3.5 font-medium text-xs uppercase tracking-[0.08em] text-[#71716D]">Role</TableHead>
                  <TableHead className="py-3.5 font-medium text-xs uppercase tracking-[0.08em] text-[#71716D]">Plan</TableHead>
                  <TableHead className="py-3.5 font-medium text-xs uppercase tracking-[0.08em] text-[#71716D]">Status</TableHead>
                  <TableHead className="py-3.5 font-medium text-xs uppercase tracking-[0.08em] text-[#71716D]">Joined</TableHead>
                  <TableHead className="py-3.5 pr-6 text-right font-medium text-xs uppercase tracking-[0.08em] text-[#71716D]">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {paginated.map((sub) => {
                  const initials = getInitials(sub.name);
                  const avatarColor = getAvatarColor(sub.name);
                  const plan = planLabel(sub.plan);
                  const planColorClass = PLAN_COLORS[plan] || "bg-[#F5F5F3] text-[#6E6E69] border-[#E8E8E3]";
                  const isActive = sub.status === "active";
                  const isPlanDropdownOpen = activePlanDropdownId === sub.id;

                  return (
                    <TableRow key={sub.id} className="hover:bg-[#FAF5EC]/40 transition-colors border-b border-[#F0F0EB] last:border-0">
                      <TableCell className="pl-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden ${sub.profilePicUrl ? 'border border-[#ECDDBB]' : avatarColor}`}>
                            {sub.profilePicUrl ? (
                              <img
                                src={sub.profilePicUrl}
                                alt={sub.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#141413] truncate">{sub.name}</p>
                            <p className="text-xs text-[#71716D] truncate">{sub.email}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5 text-xs text-[#71716D] capitalize">{sub.role}</TableCell>

                      <TableCell className="py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePlanDropdownId(isPlanDropdownOpen ? null : sub.id);
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium cursor-pointer transition-all ${planColorClass} hover:opacity-85`}
                          >
                            <span>{plan}</span>
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          </button>
                          {isPlanDropdownOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-0 z-50 mt-1 w-28 rounded-2xl bg-white border border-[#E8E8E3] shadow-soft-md py-1 animate-in fade-in zoom-in-95 duration-100"
                            >
                              {["Free", "Lite", "Pro", "Elite"].map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => handlePlanChange(sub, p.toLowerCase())}
                                  className={`w-full px-3 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                                    plan === p
                                      ? "bg-[#FAF5EC] text-[#865E16]"
                                      : "text-[#141413] hover:bg-[#FAF5EC]"
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium select-none ${
                          isActive
                            ? "bg-[#EAF2EC] text-[#28633B] border border-[#D4E6D8]"
                            : "bg-[#FDF2F2] text-[#9E3333] border border-[#F4CDCD]"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#28633B]" : "bg-[#9E3333]"}`} />
                          {isActive ? "Active" : "Suspended"}
                        </span>
                      </TableCell>

                      <TableCell className="py-3.5 text-xs text-[#71716D] whitespace-nowrap">
                        {formatDate(sub.createdAt)}
                      </TableCell>

                      <TableCell className="pr-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => handleSuspend(sub)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer whitespace-nowrap border ${
                              sub.status === "suspended"
                                ? "text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                                : "text-[#71716D] border-[#E8E8E3] bg-white hover:bg-[#FAF5EC] hover:text-[#141413]"
                            }`}
                          >
                            {sub.status === "suspended" ? "Revert Suspension" : "Suspend"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelToFree(sub)}
                            disabled={!sub.plan || sub.plan === "free"}
                            className="px-3 py-1 text-xs font-medium text-[#71716D] border border-[#E8E8E3] rounded-full bg-white hover:bg-[#FAF5EC] hover:text-[#141413] transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Cancel to Free
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filtered.length > pageSize && (
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-[#71716D]">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} members
              </span>
              <Pagination
                currentPage={currentPage}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-[#8A8A85] max-w-lg">
        Creator tier distribution and historical subscription activity.
      </p>
    </div>
  );
}
