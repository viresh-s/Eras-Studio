"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, UserCheck, Briefcase, FileText, LayoutDashboard } from "lucide-react";

interface CorNavTabsProps {
  counts?: {
    requests?: number;
    members?: number;
    applications?: number;
    opportunities?: number;
  };
}

export function CorNavTabs({ counts }: CorNavTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Overview",
      href: "/admin/cor",
      icon: LayoutDashboard,
      exact: true,
      count: undefined,
    },
    {
      name: "Creator Requests",
      href: "/admin/cor/requests",
      icon: Award,
      exact: false,
      count: counts?.requests,
      highlightCount: (counts?.requests || 0) > 0,
    },
    {
      name: "COR Members",
      href: "/admin/cor/members",
      icon: UserCheck,
      exact: false,
      count: counts?.members,
    },
    {
      name: "Opportunities",
      href: "/admin/cor/opportunities",
      icon: Briefcase,
      exact: false,
      count: counts?.opportunities,
    },
    {
      name: "Applications",
      href: "/admin/cor/applications",
      icon: FileText,
      exact: false,
      count: counts?.applications,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`group inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              isActive
                ? "bg-[#000000] text-white font-medium border border-black shadow-soft-sm"
                : "bg-white text-[#71716D] border border-[#E8E8E3] hover:text-[#141413] hover:border-[#141413] hover:bg-[#F2F0ED]"
            }`}
          >
            <Icon
              className={`w-3.5 h-3.5 stroke-[1.75] transition-colors ${
                isActive ? "text-white" : "text-[#8A8A85] group-hover:text-[#141413]"
              }`}
            />
            <span>{tab.name}</span>
            {typeof tab.count === "number" && (
              <span
                className={`ml-0.5 px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                  tab.highlightCount
                    ? isActive
                      ? "bg-white text-[#1345EE]"
                      : "bg-[#1345EE] text-white"
                    : isActive
                    ? "bg-white text-[#1345EE]"
                    : "bg-[#F2F0ED] text-[#1345EE] border border-[#1345EE]/25"
                }`}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
