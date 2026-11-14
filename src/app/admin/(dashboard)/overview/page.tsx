import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  ArtworksIcon,
  CreatorsIcon,
  ApplicationsIcon,
  UsersIcon,
} from "@/components/admin/icons";
import {
  usersRepo,
  creatorsRepo,
  artworksRepo,
  corRepo,
  applicationsRepo,
} from "@/lib/data";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { GenerateReportButton } from "@/components/reports/GenerateReportButton";

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function OverviewPage() {
  const [
    userStats,
    creatorStats,
    artworkStats,
    corStats,
    appStats,
    allUsers,
  ] = await Promise.all([
    usersRepo.stats(),
    creatorsRepo.stats(),
    artworksRepo.stats(),
    corRepo.stats(),
    applicationsRepo.stats(),
    usersRepo.list(),
  ]);

  // Last 5 users sorted by creation date descending
  const recentSignups = [...allUsers]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const keyMatrixStats = [
    { label: "Total Users", value: userStats.total, href: "/admin/users" },
    { label: "Creators", value: userStats.creators, href: "/admin/creators" },
    { label: "Collectors", value: userStats.collectors, href: "/admin/collectors" },
    { label: "Artworks", value: artworkStats.published, href: "/admin/artworks" },
    { label: "Free Tier", value: creatorStats.free, href: "/admin/users" },
    { label: "Elite Tier", value: creatorStats.elite, href: "/admin/users" },
    { label: "Pro Tier", value: creatorStats.pro, href: "/admin/users" },
    { label: "COR Members", value: corStats.active, href: "/admin/cor/members" },
  ];

  const attentionItems = [
    {
      title: "Pending Artworks",
      description: "Submissions awaiting curatorial review",
      count: artworkStats.pending,
      href: "/admin/artworks?status=pending",
      icon: ArtworksIcon,
    },
    {
      title: "Pending Creators",
      description: "Creator applications awaiting verification",
      count: creatorStats.pending,
      href: "/admin/creators?status=pending",
      icon: CreatorsIcon,
    },
    {
      title: "Pending Applications",
      description: "Open call & residency submissions",
      count: appStats.pending,
      href: "/admin/cor/applications",
      icon: ApplicationsIcon,
    },
  ];

  const totalNeedsAttention =
    artworkStats.pending + creatorStats.pending + appStats.pending;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="border-b border-[#E8E8E3] pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="admin-century-title text-3xl sm:text-4xl tracking-tight text-[#141413] leading-tight">
            Studio Pulse.
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-[#6E6E69] max-w-2xl leading-relaxed">
            Live marketplace activity, member registrations, and curatorial queues.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
          <span className="text-[11px] text-[#8A8A85] tracking-tight hidden md:inline">
            Refreshed live
          </span>
          <GenerateReportButton />
        </div>
      </div>

      {/* REDESIGNED KEY MATRIX: Clean Compact Inline Dashboard Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-[#1345EE] font-sans flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1345EE]" />
            Key Matrix
          </h2>
          <span className="text-[11px] text-[#8A8A85] font-sans hidden sm:inline">
            Platform Vitals Overview
          </span>
        </div>

        {/* Inline Metrics Strip: Clean horizontal arrangement on desktop, wrapping on tablet/mobile with subtle hairline dividers */}
        <div className="bg-white border border-[#E8E8E3] rounded-2xl shadow-soft-sm overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-y divide-[#E8E8E3] sm:divide-y-0 sm:divide-x divide-y-reverse">
            {keyMatrixStats.map((stat, idx) => (
              <Link
                key={stat.label}
                href={stat.href}
                className={`group block px-4 py-3.5 sm:py-4 transition-colors hover:bg-[#F2F0ED]/50 ${
                  idx >= 4 ? "sm:border-t lg:border-t-0 sm:border-[#E8E8E3]" : ""
                } ${idx % 2 === 1 ? "border-l border-[#E8E8E3] sm:border-l-0" : ""}`}
              >
                <span className="block text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-[#73736C] group-hover:text-[#1345EE] transition-colors truncate">
                  {stat.label}
                </span>
                <span className="block text-2xl sm:text-3xl font-semibold tracking-tight text-[#141413] mt-1 group-hover:text-[#1345EE] transition-colors font-sans tabular-nums">
                  {stat.value}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Two Sections Grid: Recent Signups (2/3) + Needs Attention (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Section 1: Recent Signups */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium text-[#141413] tracking-tight">
              Recent Signups
            </h3>
            <Link
              href="/admin/users"
              className="text-xs text-[#141413] hover:text-[#1345EE] font-medium inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-[#E8E8E3] bg-white hover:bg-[#F2F0ED] transition-all shadow-2xs"
            >
              <span>View all patrons</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card padded={false} className="overflow-hidden rounded-2xl shadow-soft-sm border border-[#E8E8E3]">
            {recentSignups.length === 0 ? (
              <EmptyState
                icon={<UsersIcon size={24} className="text-[#8A8A85]" />}
                title="No recent signups"
                description="New member registrations will appear here in chronological order."
                className="py-12 border-none"
              />
            ) : (
              <div className="divide-y divide-[#E8E8E3]">
                {/* Table Header */}
                <div className="grid grid-cols-12 px-5 py-3.5 text-xs font-medium text-[#73736C] bg-[#F2F0ED]/70 uppercase tracking-wider font-sans">
                  <div className="col-span-5">Member</div>
                  <div className="col-span-2 text-center">Role</div>
                  <div className="col-span-2 text-center">Plan</div>
                  <div className="col-span-3 text-right">Joined</div>
                </div>

                {/* Table Rows */}
                {recentSignups.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-12 items-center px-5 py-3.5 text-xs md:text-sm hover:bg-[#F2F0ED]/40 transition-colors"
                  >
                    <div className="col-span-5 min-w-0 pr-2 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#000000] border border-black flex items-center justify-center text-xs font-medium text-white shrink-0 overflow-hidden">
                        {user.profilePicUrl ? (
                          <img
                            src={user.profilePicUrl}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          getInitials(user.name)
                        )}
                      </div>
                      <div className="truncate min-w-0">
                        <p className="font-medium text-[#141413] truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-[#6E6E69] truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2 text-center">
                      <Badge
                        variant={user.role === "creator" ? "accent" : "default"}
                        size="sm"
                        className="capitalize rounded-md font-medium"
                      >
                        {user.role}
                      </Badge>
                    </div>

                    <div className="col-span-2 text-center">
                      {user.plan ? (
                        <Badge
                          variant={
                            user.plan === "elite"
                              ? "warning"
                              : user.plan === "pro"
                              ? "accent"
                              : "default"
                          }
                          size="sm"
                          className="capitalize rounded-md font-medium"
                        >
                          {user.plan}
                        </Badge>
                      ) : (
                        <span className="text-[#8A8A85] text-xs">—</span>
                      )}
                    </div>

                    <div className="col-span-3 text-right text-xs text-[#6E6E69]">
                      {formatDate(user.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Section 2: Needs Attention */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium text-[#141413] tracking-tight">
              Needs Attention
            </h3>
            {totalNeedsAttention > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[#000000] text-white border border-black">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1345EE]" />
                {totalNeedsAttention} pending
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[#F0F5F1] text-[#28633B] border border-[#CDE3D4]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#28633B]" />
                All clear
              </span>
            )}
          </div>

          <div className="space-y-3">
            {attentionItems.map((item) => {
              const Icon = item.icon;
              const hasPending = item.count > 0;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group block bg-white border border-[#E8E8E3] hover:border-[#1345EE]/40 rounded-3xl p-4 transition-all duration-150 shadow-soft-sm hover:shadow-soft-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#000000] border border-black flex items-center justify-center shrink-0 text-white group-hover:bg-[#1345EE] group-hover:text-white transition-colors">
                        <Icon size={16} className="stroke-[1.75]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-medium text-[#141413] group-hover:text-[#1345EE] transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-[#6E6E69] mt-0.5 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-md ${
                          hasPending
                            ? "bg-[#000000] text-white border border-black"
                            : "bg-[#F3F3EF] text-[#71716D] border border-[#E5E5DF]"
                        }`}
                      >
                        {item.count}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#8A8A85] group-hover:text-[#1345EE] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              );
            })}

            {totalNeedsAttention === 0 && (
              <div className="p-6 rounded-3xl border border-dashed border-[#DCDCD5] bg-white/60 text-center">
                <CheckCircle2 className="w-5 h-5 text-[#28633B] mx-auto mb-1.5" />
                <p className="text-sm font-medium text-[#141413]">
                  All queues cleared
                </p>
                <p className="text-xs text-[#6E6E69] mt-0.5">
                  No submissions or verification items are currently awaiting curatorial review.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
