"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Palette,
  Award,
  ShieldAlert,
  CreditCard,
  Sliders,
  Briefcase,
  Menu,
  X,
  LogOut,
  Loader2,
  ArrowUpRight,
  Database as DbIcon,
} from "lucide-react";
import { ToastProvider } from "@/components/ui";
import { isBrowserSupabaseConfigured } from "@/lib/supabase/client";
import { getAdminSidebarCountsAction, SidebarCounts } from "@/app/admin/sidebar-actions";
import { motion, LayoutGroup } from "framer-motion";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Overview", href: "/admin/overview", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "Creators", href: "/admin/creators", icon: Sparkles },
  { name: "Collectors", href: "/admin/collectors", icon: Users },
  { name: "Artworks", href: "/admin/artworks", icon: Palette },
  { name: "Reports", href: "/admin/reports", icon: ShieldAlert },
  { name: "COR", href: "/admin/cor", icon: Award },
  { name: "Careers", href: "/admin/careers", icon: Briefcase },
  { name: "Studio Settings", href: "/admin/settings", icon: Sliders },
];

const corSubNav = [
  { name: "Requests", href: "/admin/cor/requests" },
  { name: "Members", href: "/admin/cor/members" },
  { name: "Applications", href: "/admin/cor/applications" },
  { name: "Opportunities", href: "/admin/cor/opportunities" },
];

function getPageTitle(pathname: string): string {
  if (pathname.includes("/admin/overview")) return "Overview";
  if (pathname.includes("/admin/users")) return "Users";
  if (pathname.includes("/admin/subscriptions")) return "Subscriptions";
  if (pathname.includes("/admin/creators")) return "Creators";
  if (pathname.includes("/admin/collectors")) return "Overview";
  if (pathname.includes("/admin/artworks")) return "Artworks";
  if (pathname.includes("/admin/reports")) return "Reports & Moderation";
  if (pathname.includes("/admin/cor/requests")) return "Creator Requests";
  if (pathname.includes("/admin/cor/members")) return "COR Members";
  if (pathname.includes("/admin/cor/applications")) return "Representation Applications";
  if (pathname.includes("/admin/cor/opportunities")) return "Institutional Opportunities";
  if (pathname.includes("/admin/cor")) return "COR";
  if (pathname.includes("/admin/careers")) return "Careers Management";
  if (pathname.includes("/admin/settings")) return "Studio Settings";
  return "Overview";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [serverCounts, setServerCounts] = useState<SidebarCounts>({
    creators: 0,
    artworks: 0,
    reports: 0,
    corRequests: 0,
    corApplications: 0,
    totalCor: 0,
  });
  const [clearedCounts, setClearedCounts] = useState<Partial<SidebarCounts>>({});
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [hoveredSubHref, setHoveredSubHref] = useState<string | null>(null);
  const [mobileHoveredHref, setMobileHoveredHref] = useState<string | null>(null);
  const [mobileHoveredSubHref, setMobileHoveredSubHref] = useState<string | null>(null);

  // Initialize cleared counts from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("adminSidebarClearedCounts");
      if (stored) {
        setClearedCounts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Could not parse stored counts", e);
    }
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await getAdminSidebarCountsAction();
        if (res.success && res.counts) {
          setServerCounts(res.counts);
        }
      } catch (error) {
        console.error("Failed to fetch sidebar counts:", error);
      }
    };

    fetchCounts();
    const intervalId = setInterval(fetchCounts, 5000);
    return () => clearInterval(intervalId);
  }, [pathname]);

  // Update cleared counts when a section is visited
  useEffect(() => {
    let changed = false;
    const newCleared = { ...clearedCounts };

    const checkAndClear = (pathMatch: string, key: keyof SidebarCounts) => {
      if (pathname === pathMatch || pathname.startsWith(`${pathMatch}/`)) {
        if (newCleared[key] !== serverCounts[key]) {
          newCleared[key] = serverCounts[key];
          changed = true;
        }
      }
    };

    checkAndClear("/admin/creators", "creators");
    checkAndClear("/admin/artworks", "artworks");
    checkAndClear("/admin/reports", "reports");
    checkAndClear("/admin/cor/requests", "corRequests");
    checkAndClear("/admin/cor/applications", "corApplications");

    if (changed) {
      setClearedCounts(newCleared);
      try {
        localStorage.setItem("adminSidebarClearedCounts", JSON.stringify(newCleared));
      } catch (e) {}
    }
  }, [pathname, serverCounts, clearedCounts]);

  // Calculate actual display counts
  const displayCounts = {
    creators: Math.max(0, serverCounts.creators - (clearedCounts.creators || 0)),
    artworks: Math.max(0, serverCounts.artworks - (clearedCounts.artworks || 0)),
    reports: Math.max(0, serverCounts.reports - (clearedCounts.reports || 0)),
    corRequests: Math.max(0, serverCounts.corRequests - (clearedCounts.corRequests || 0)),
    corApplications: Math.max(0, serverCounts.corApplications - (clearedCounts.corApplications || 0)),
  };
  const displayTotalCor = displayCounts.corRequests + displayCounts.corApplications;

  const currentPageTitle = getPageTitle(pathname);

  const toggleMobileDrawer = () => setMobileDrawerOpen((prev) => !prev);
  const closeMobileDrawer = () => setMobileDrawerOpen(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileDrawerOpen) {
        closeMobileDrawer();
      }
    };
    if (mobileDrawerOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
      window.location.href = "/admin/login";
    } catch (err) {
      console.error("Logout error:", err);
      window.location.href = "/admin/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <ToastProvider>
      <div className="admin-scope min-h-screen bg-[#F2F0ED] text-[#141413] flex flex-col lg:flex-row font-sans selection:bg-[#000000] selection:text-white">
        {/* Mobile Top Navigation Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E8E8E3] px-5 py-3.5 flex items-center justify-between">
          <Link
            href="/admin/overview"
            onClick={closeMobileDrawer}
            className="flex items-center gap-1.5 select-none"
          >
            <Image
              src="/images/eras-logo.png"
              alt="ERAS"
              width={80}
              height={20}
              className="h-5 w-auto object-contain"
              priority
            />
            <span className="font-medium text-xl tracking-tight text-[#141413]">
              Studio
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1345EE] mb-1 ml-0.5 inline-block" />
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#1345EE]/30 bg-white">
              <div className="w-5 h-5 rounded-full bg-[#000000] border border-black flex items-center justify-center text-[10px] font-medium text-white">
                A
              </div>
              <span className="text-xs font-medium text-[#1345EE]">Admin</span>
            </div>

            <button
              type="button"
              onClick={toggleMobileDrawer}
              aria-label={mobileDrawerOpen ? "Close menu" : "Open menu"}
              className="p-2 rounded-lg border border-[#E8E8E3] bg-white text-[#141413] hover:bg-[#F2F0ED] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#141413]"
            >
              {mobileDrawerOpen ? (
                <X className="w-4 h-4 stroke-[2]" />
              ) : (
                <Menu className="w-4 h-4 stroke-[2]" />
              )}
            </button>
          </div>
        </header>

        {/* Mobile Top Drawer Overlay & Panel */}
        {mobileDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-30 pt-[61px]">
            <div
              className="fixed inset-0 bg-[#141413]/30 backdrop-blur-[2px] transition-opacity"
              onClick={closeMobileDrawer}
            />

            <div className="relative bg-white border-b border-[#E8E8E3] px-5 py-6 shadow-soft-xl space-y-6 animate-in slide-in-from-top-2 duration-200">
              <LayoutGroup id="admin-mobile-sidebar">
                <nav
                  className="space-y-1 relative"
                  onMouseLeave={() => {
                    setMobileHoveredHref(null);
                    setMobileHoveredSubHref(null);
                  }}
                >
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isCor = item.href === "/admin/cor";
                    const isCorActive = isCor && (pathname === "/admin/cor" || pathname.startsWith("/admin/cor/"));
                    const isActive =
                      pathname === item.href ||
                      (!isCor && pathname.startsWith(`${item.href}/`)) ||
                      (isCor && pathname === "/admin/cor");
                    const isItemActive = isActive || (isCor && isCorActive);
                    const isHovered = mobileHoveredHref === item.href;

                    return (
                      <div key={item.href} className="space-y-1">
                        <Link
                          href={item.href}
                          onClick={closeMobileDrawer}
                          onMouseEnter={() => setMobileHoveredHref(item.href)}
                          className={`relative flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 select-none ${
                            isItemActive
                              ? "text-[#1345EE] font-medium"
                              : isHovered
                              ? "text-[#1345EE]"
                              : "text-[#6E6E69] hover:text-[#1345EE]"
                          }`}
                        >
                          {/* Active page animated soft light-blue background */}
                          {isItemActive && (
                            <motion.div
                              layoutId="mobile-active-pill"
                              className="absolute inset-0 rounded-xl bg-[#EEF2FE] border border-[#1345EE]/15 shadow-2xs -z-10"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}

                          {/* Hover gliding pill when item is not active */}
                          {isHovered && !isItemActive && (
                            <motion.div
                              layoutId="mobile-hover-pill"
                              className="absolute inset-0 rounded-xl bg-[#1345EE]/[0.06] border border-[#1345EE]/10 -z-10"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            />
                          )}

                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 stroke-[1.75] transition-colors duration-200 ${
                                isItemActive || isHovered ? "text-[#1345EE]" : "text-[#8A8A85]"
                              }`}
                            />
                            <span className="transition-colors duration-200">{item.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.name === "Creators" && displayCounts.creators > 0 && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center transition-all duration-200 ${
                                  isItemActive
                                    ? "bg-[#1345EE] text-white shadow-2xs"
                                    : isHovered
                                    ? "bg-[#1345EE]/15 text-[#1345EE] border border-[#1345EE]/30"
                                    : "bg-[#F2F0ED] text-[#1345EE] border border-[#1345EE]/25"
                                }`}
                              >
                                {displayCounts.creators}
                              </span>
                            )}
                            {item.name === "Artworks" && displayCounts.artworks > 0 && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center transition-all duration-200 ${
                                  isItemActive
                                    ? "bg-[#1345EE] text-white shadow-2xs"
                                    : isHovered
                                    ? "bg-[#1345EE]/15 text-[#1345EE] border border-[#1345EE]/30"
                                    : "bg-[#F2F0ED] text-[#1345EE] border border-[#1345EE]/25"
                                }`}
                              >
                                {displayCounts.artworks}
                              </span>
                            )}
                            {item.name === "Reports" && displayCounts.reports > 0 && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center transition-all duration-200 ${
                                  isItemActive
                                    ? "bg-[#1345EE] text-white shadow-2xs"
                                    : isHovered
                                    ? "bg-[#1345EE]/15 text-[#1345EE] border border-[#1345EE]/30"
                                    : "bg-[#F2F0ED] text-[#1345EE] border border-[#1345EE]/25"
                                }`}
                              >
                                {displayCounts.reports}
                              </span>
                            )}
                            {item.name === "COR" && displayTotalCor > 0 && !isCorActive && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center transition-all duration-200 ${
                                  isHovered
                                    ? "bg-[#1345EE]/15 text-[#1345EE] border border-[#1345EE]/30"
                                    : "bg-[#F2F0ED] text-[#1345EE] border border-[#1345EE]/25"
                                }`}
                              >
                                {displayTotalCor}
                              </span>
                            )}

                            {/* Animated Small Blue Circular Indicator */}
                            {isItemActive && (
                              <motion.span
                                layoutId="mobile-active-indicator"
                                className="w-1.5 h-1.5 rounded-full bg-[#1345EE] shadow-[0_0_6px_rgba(19,69,238,0.45)] shrink-0"
                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                              />
                            )}
                          </div>
                        </Link>

                        {isCor && isCorActive && (
                          <div
                            className="pl-6 py-1 space-y-1 border-l-2 border-[#1345EE]/20 ml-5 my-1 relative"
                            onMouseLeave={() => setMobileHoveredSubHref(null)}
                          >
                            {corSubNav.map((sub) => {
                              const isSubActive =
                                pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                              const isSubHovered = mobileHoveredSubHref === sub.href;
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  onClick={closeMobileDrawer}
                                  onMouseEnter={() => setMobileHoveredSubHref(sub.href)}
                                  className={`relative flex items-center justify-between px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 select-none ${
                                    isSubActive
                                      ? "text-[#1345EE] font-medium"
                                      : isSubHovered
                                      ? "text-[#1345EE]"
                                      : "text-[#6E6E69] hover:text-[#1345EE]"
                                  }`}
                                >
                                  {isSubActive && (
                                    <motion.div
                                      layoutId="mobile-sub-active-pill"
                                      className="absolute inset-0 rounded-lg bg-[#EEF2FE] border border-[#1345EE]/15 -z-10"
                                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                  )}
                                  {isSubHovered && !isSubActive && (
                                    <motion.div
                                      layoutId="mobile-sub-hover-pill"
                                      className="absolute inset-0 rounded-lg bg-[#1345EE]/[0.06] -z-10"
                                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                    />
                                  )}
                                  <span>{sub.name}</span>
                                  <div className="flex items-center gap-1.5">
                                    {sub.name === "Requests" && displayCounts.corRequests > 0 && (
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                          isSubActive
                                            ? "bg-[#1345EE] text-white"
                                            : "bg-white border border-[#1345EE]/30 text-[#1345EE]"
                                        }`}
                                      >
                                        {displayCounts.corRequests}
                                      </span>
                                    )}
                                    {sub.name === "Applications" && displayCounts.corApplications > 0 && (
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                          isSubActive
                                            ? "bg-[#1345EE] text-white"
                                            : "bg-white border border-[#1345EE]/30 text-[#1345EE]"
                                        }`}
                                      >
                                        {displayCounts.corApplications}
                                      </span>
                                    )}
                                    {isSubActive && (
                                      <motion.span
                                        layoutId="mobile-sub-active-dot"
                                        className="w-1.5 h-1.5 rounded-full bg-[#1345EE] shrink-0"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                      />
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </LayoutGroup>

              <div className="pt-4 border-t border-[#E8E8E3] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#000000] border border-black flex items-center justify-center text-xs font-medium text-white">
                    A
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-[#141413]">Admin Console</p>
                    <p className="text-[11px] text-[#6E6E69]">admin123@erasstudio.com</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeMobileDrawer();
                    handleLogout();
                  }}
                  disabled={isLoggingOut}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E8E8E3] bg-white text-xs uppercase tracking-[0.08em] font-medium text-[#6E6E69] hover:text-[#B83838] hover:border-[#F2C6C6] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
                >
                  {isLoggingOut ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5 stroke-[1.75]" />
                  )}
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Persistent Left Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-[#E8E8E3] bg-white min-h-screen sticky top-0 h-screen select-none shadow-soft-sm">
          {/* Top Brand Header */}
          <div className="p-6 border-b border-[#E8E8E3] flex items-center justify-between">
            <Link href="/admin/overview" className="flex items-center gap-1.5 group">
              <Image
                src="/images/eras-logo.png"
                alt="ERAS"
                width={80}
                height={20}
                className="h-5 w-auto object-contain group-hover:opacity-85 transition-opacity"
                priority
              />
              <span className="font-medium text-xl tracking-tight text-[#141413]">
                Studio
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1345EE] mb-1 ml-0.5 inline-block" />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="mb-3 px-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#1345EE] font-sans flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1345EE]" />
              Platform
            </div>
            <LayoutGroup id="admin-desktop-sidebar">
              <nav
                className="space-y-1 relative"
                onMouseLeave={() => {
                  setHoveredHref(null);
                  setHoveredSubHref(null);
                }}
              >
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isCor = item.href === "/admin/cor";
                  const isCorActive = isCor && (pathname === "/admin/cor" || pathname.startsWith("/admin/cor/"));
                  const isActive =
                    pathname === item.href ||
                    (!isCor && pathname.startsWith(`${item.href}/`)) ||
                    (isCor && pathname === "/admin/cor");
                  const isItemActive = isActive || (isCor && isCorActive);
                  const isHovered = hoveredHref === item.href;

                  return (
                    <div key={item.href} className="space-y-1">
                      <Link
                        href={item.href}
                        onMouseEnter={() => setHoveredHref(item.href)}
                        className={`relative group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-colors duration-200 select-none ${
                          isItemActive
                            ? "text-[#1345EE] font-medium"
                            : isHovered
                            ? "text-[#1345EE]"
                            : "text-[#6E6E69] hover:text-[#1345EE]"
                        }`}
                      >
                        {/* Active Page Animated Pill */}
                        {isItemActive && (
                          <motion.div
                            layoutId="desktop-active-pill"
                            className="absolute inset-0 rounded-xl bg-[#EEF2FE] border border-[#1345EE]/15 shadow-2xs -z-10"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}

                        {/* Hover Gliding Pill (when not active item) */}
                        {isHovered && !isItemActive && (
                          <motion.div
                            layoutId="desktop-hover-pill"
                            className="absolute inset-0 rounded-xl bg-[#1345EE]/[0.06] border border-[#1345EE]/10 -z-10"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          />
                        )}

                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 stroke-[1.75] transition-colors duration-200 ${
                              isItemActive || isHovered
                                ? "text-[#1345EE]"
                                : "text-[#8A8A85] group-hover:text-[#1345EE]"
                            }`}
                          />
                          <span className="transition-colors duration-200">{item.name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.name === "Creators" && displayCounts.creators > 0 && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center transition-all duration-200 ${
                                isItemActive
                                  ? "bg-[#1345EE] text-white shadow-2xs"
                                  : isHovered
                                  ? "bg-[#1345EE]/15 text-[#1345EE] border border-[#1345EE]/30"
                                  : "bg-[#F2F0ED] text-[#1345EE] border border-[#1345EE]/25"
                              }`}
                            >
                              {displayCounts.creators}
                            </span>
                          )}
                          {item.name === "Artworks" && displayCounts.artworks > 0 && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center transition-all duration-200 ${
                                isItemActive
                                  ? "bg-[#1345EE] text-white shadow-2xs"
                                  : isHovered
                                  ? "bg-[#1345EE]/15 text-[#1345EE] border border-[#1345EE]/30"
                                  : "bg-[#F2F0ED] text-[#1345EE] border border-[#1345EE]/25"
                              }`}
                            >
                              {displayCounts.artworks}
                            </span>
                          )}
                          {item.name === "Reports" && displayCounts.reports > 0 && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center transition-all duration-200 ${
                                isItemActive
                                  ? "bg-[#1345EE] text-white shadow-2xs"
                                  : isHovered
                                  ? "bg-[#1345EE]/15 text-[#1345EE] border border-[#1345EE]/30"
                                  : "bg-[#F2F0ED] text-[#1345EE] border border-[#1345EE]/25"
                              }`}
                            >
                              {displayCounts.reports}
                            </span>
                          )}
                          {item.name === "COR" && displayTotalCor > 0 && !isCorActive && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md min-w-[20px] text-center transition-all duration-200 ${
                                isHovered
                                  ? "bg-[#1345EE]/15 text-[#1345EE] border border-[#1345EE]/30"
                                  : "bg-[#F2F0ED] text-[#1345EE] border border-[#1345EE]/25"
                              }`}
                            >
                              {displayTotalCor}
                            </span>
                          )}

                          {/* Animated Small Blue Circular Indicator */}
                          {isItemActive && (
                            <motion.span
                              layoutId="desktop-active-indicator"
                              className="w-1.5 h-1.5 rounded-full bg-[#1345EE] shadow-[0_0_6px_rgba(19,69,238,0.45)] shrink-0"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                        </div>
                      </Link>

                      {/* Render COR sub-nav when in COR section */}
                      {isCor && isCorActive && (
                        <div
                          className="pl-5 pr-2 py-1 space-y-1 border-l-2 border-[#1345EE]/20 ml-5 my-1 relative"
                          onMouseLeave={() => setHoveredSubHref(null)}
                        >
                          {corSubNav.map((sub) => {
                            const isSubActive =
                              pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                            const isSubHovered = hoveredSubHref === sub.href;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onMouseEnter={() => setHoveredSubHref(sub.href)}
                                className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 select-none ${
                                  isSubActive
                                    ? "text-[#1345EE] font-medium"
                                    : isSubHovered
                                    ? "text-[#1345EE]"
                                    : "text-[#6E6E69] hover:text-[#1345EE]"
                                }`}
                              >
                                {isSubActive && (
                                  <motion.div
                                    layoutId="desktop-sub-active-pill"
                                    className="absolute inset-0 rounded-lg bg-[#EEF2FE] border border-[#1345EE]/15 -z-10"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                  />
                                )}
                                {isSubHovered && !isSubActive && (
                                  <motion.div
                                    layoutId="desktop-sub-hover-pill"
                                    className="absolute inset-0 rounded-lg bg-[#1345EE]/[0.06] -z-10"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                  />
                                )}
                                <span>{sub.name}</span>
                                <div className="flex items-center gap-1.5">
                                  {sub.name === "Requests" && displayCounts.corRequests > 0 && (
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                        isSubActive
                                          ? "bg-[#1345EE] text-white"
                                          : "bg-white border border-[#1345EE]/30 text-[#1345EE]"
                                      }`}
                                    >
                                      {displayCounts.corRequests}
                                    </span>
                                  )}
                                  {sub.name === "Applications" && displayCounts.corApplications > 0 && (
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                        isSubActive
                                          ? "bg-[#1345EE] text-white"
                                          : "bg-white border border-[#1345EE]/30 text-[#1345EE]"
                                      }`}
                                    >
                                      {displayCounts.corApplications}
                                    </span>
                                  )}
                                  {isSubActive && (
                                    <motion.span
                                      layoutId="desktop-sub-active-dot"
                                      className="w-1.5 h-1.5 rounded-full bg-[#1345EE] shrink-0"
                                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </LayoutGroup>

            <div className="mt-8 mb-3 px-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#1345EE] font-sans flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1345EE]" />
              Directory
            </div>
            <div className="space-y-1 text-xs">
              <Link
                href="/discovery"
                className="flex items-center justify-between px-3.5 py-2 rounded-lg text-[#6E6E69] hover:text-[#141413] hover:bg-[#F2F0ED] transition-colors"
              >
                <span>Browse Gallery</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#8A8A85]" />
              </Link>
              <Link
                href="/about"
                className="flex items-center justify-between px-3.5 py-2 rounded-lg text-[#6E6E69] hover:text-[#141413] hover:bg-[#F2F0ED] transition-colors"
              >
                <span>About Eras</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#8A8A85]" />
              </Link>
            </div>
          </div>

          {/* Sidebar Footer with Session & Logout */}
          <div className="p-4 border-t border-[#E8E8E3] bg-white">
            <div className="flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-[#E8E8E3] hover:bg-[#F2F0ED]/40 transition-all">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#000000] border border-black flex items-center justify-center text-xs font-medium text-white shrink-0">
                  A
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-medium text-[#141413] truncate">
                    Admin User
                  </p>
                  <p className="text-[11px] text-[#6E6E69] truncate">
                    Curatorial Lead
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-label="Log out"
                title="Log out"
                className="p-2 rounded-lg text-[#8A8A85] hover:text-[#B83838] hover:bg-[#FDF2F2] transition-colors ml-1 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#141413]"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 stroke-[1.75]" />
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area with Dynamic Top Bar */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#F2F0ED]">
          {/* Desktop Top Bar */}
          <header className="hidden lg:flex items-center justify-between h-16 px-8 border-b border-[#E8E8E3] bg-white/85 backdrop-blur-md sticky top-0 z-20">
            {/* Active Page Title */}
            <div>
              <h1 className="admin-century-title text-xl sm:text-2xl tracking-tight text-[#141413]">
                {currentPageTitle}
              </h1>
            </div>

            {/* Right Top Bar Controls: Supabase Pill, Admin Pill & Logout Button */}
            <div className="flex items-center gap-3">
              {/* Supabase Status Pill */}
              <div
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#E8E8E3] bg-white text-xs text-[#6E6E69] shadow-2xs"
                title={
                  isBrowserSupabaseConfigured
                    ? "Connected to live Supabase database"
                    : "Using local in-memory dataset."
                }
              >
                <DbIcon className="w-3.5 h-3.5 text-[#1345EE]" />
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isBrowserSupabaseConfigured
                      ? "bg-[#28633B] animate-pulse"
                      : "bg-[#1345EE]"
                  }`}
                />
                <span className="font-medium text-[#141413]">
                  {isBrowserSupabaseConfigured ? "Supabase Live" : "DB: Local Mode"}
                </span>
              </div>

              {/* Admin Avatar Pill */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#1345EE]/30 bg-white text-xs text-[#141413] shadow-2xs">
                <div className="w-5 h-5 rounded-full bg-[#000000] border border-black flex items-center justify-center text-[10px] font-medium text-white">
                  A
                </div>
                <span className="font-medium text-[#1345EE]">Admin</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#28633B] ml-0.5" title="Online" />
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-label="Log out"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-[#E8E8E3] bg-white text-xs uppercase tracking-[0.08em] font-medium text-[#141413] hover:text-[#B83838] hover:border-[#F2C6C6] hover:bg-[#FDF2F2] transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#141413] shadow-2xs"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5 stroke-[1.75]" />
                )}
                <span>Logout</span>
              </button>
            </div>
          </header>

          {/* Page Content Container */}
          <div className="flex-1 px-4 py-6 sm:px-6 md:px-8 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
