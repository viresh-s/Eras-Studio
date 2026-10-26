"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  if (pathname.includes("/admin/artworks")) return "Artworks";
  if (pathname.includes("/admin/reports")) return "Reports & moderation";
  if (pathname.includes("/admin/cor/requests")) return "COR Requests";
  if (pathname.includes("/admin/cor/members")) return "COR Members";
  if (pathname.includes("/admin/cor/applications")) return "COR Applications";
  if (pathname.includes("/admin/cor/opportunities")) return "COR Opportunities";
  if (pathname.includes("/admin/cor")) return "Career Operations & Representation (COR)";
  if (pathname.includes("/admin/settings")) return "Studio settings";
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
      <div className="min-h-screen bg-[#FAF5EC] text-[#141413] flex flex-col lg:flex-row font-sans selection:bg-[#141413] selection:text-white">
        {/* Mobile Top Navigation Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E8E8E3] px-5 py-3.5 flex items-center justify-between">
          <Link
            href="/admin/overview"
            onClick={closeMobileDrawer}
            className="flex items-center gap-1 select-none"
          >
            <span className="font-serif italic font-semibold text-2xl tracking-tight text-[#141413]">
              Eras
            </span>
            <span className="font-serif font-medium text-xl tracking-tight text-[#141413]">
              Studio
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#865E16] mb-1 ml-0.5 inline-block" />
            <span className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#865E16] px-2 py-0.5 rounded-full border border-[#ECDDBB] bg-[#FAF5EC] ml-1.5">
              Admin
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#E8E8E3] bg-[#FAF5EC]">
              <div className="w-5 h-5 rounded-full bg-white border border-[#E8E8E3] flex items-center justify-center text-[10px] font-semibold text-[#141413]">
                A
              </div>
              <span className="text-xs font-medium text-[#141413]">Admin</span>
            </div>

            <button
              type="button"
              onClick={toggleMobileDrawer}
              aria-label={mobileDrawerOpen ? "Close menu" : "Open menu"}
              className="p-2 rounded-full border border-[#E8E8E3] bg-white text-[#141413] hover:bg-[#FAF5EC] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#141413]"
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
              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isCor = item.href === "/admin/cor";
                  const isCorActive = isCor && (pathname === "/admin/cor" || pathname.startsWith("/admin/cor/"));
                  const isActive =
                    pathname === item.href ||
                    (!isCor && pathname.startsWith(`${item.href}/`)) ||
                    (isCor && pathname === "/admin/cor");
                  return (
                    <div key={item.href} className="space-y-1">
                      <Link
                        href={item.href}
                        onClick={closeMobileDrawer}
                        className={`flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                          isActive || (isCor && isCorActive)
                            ? "bg-[#141413] text-white shadow-xs"
                            : "text-[#6E6E69] hover:text-[#141413] hover:bg-[#FAF5EC]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 stroke-[1.75] ${
                              isActive || (isCor && isCorActive) ? "text-[#FAF5EC]" : "text-[#8A8A85]"
                            }`}
                          />
                          <span>{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.name === "Creators" && displayCounts.creators > 0 && (
                            <span className="text-[10px] font-bold bg-[#FAF5EC] text-[#865E16] px-2 py-0.5 rounded-full border border-[#ECDDBB]">
                              {displayCounts.creators}
                            </span>
                          )}
                          {item.name === "Artworks" && displayCounts.artworks > 0 && (
                            <span className="text-[10px] font-bold bg-[#FAF5EC] text-[#865E16] px-2 py-0.5 rounded-full border border-[#ECDDBB]">
                              {displayCounts.artworks}
                            </span>
                          )}
                          {item.name === "Reports" && displayCounts.reports > 0 && (
                            <span className="text-[10px] font-bold bg-[#FAF5EC] text-[#865E16] px-2 py-0.5 rounded-full border border-[#ECDDBB]">
                              {displayCounts.reports}
                            </span>
                          )}
                          {item.name === "COR" && displayTotalCor > 0 && !isCorActive && (
                            <span className="text-[10px] font-bold bg-[#FAF5EC] text-[#865E16] px-2 py-0.5 rounded-full border border-[#ECDDBB]">
                              {displayTotalCor}
                            </span>
                          )}
                          {(isActive || (isCor && isCorActive)) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
                          )}
                        </div>
                      </Link>

                      {isCor && isCorActive && (
                        <div className="pl-6 py-1 space-y-1 border-l-2 border-[#E8E8E3] ml-5 my-1">
                          {corSubNav.map((sub) => {
                            const isSubActive =
                              pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={closeMobileDrawer}
                                className={`flex items-center justify-between px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                  isSubActive
                                    ? "bg-[#FAF5EC] text-[#865E16] font-semibold border border-[#ECDDBB]"
                                    : "text-[#6E6E69] hover:text-[#141413] hover:bg-[#FAF5EC]/50"
                                }`}
                              >
                                <span>{sub.name}</span>
                                {sub.name === "Requests" && displayCounts.corRequests > 0 && (
                                  <span className="text-[9px] font-bold bg-white border border-[#ECDDBB] text-[#865E16] px-1.5 py-0.5 rounded-full">
                                    {displayCounts.corRequests}
                                  </span>
                                )}
                                {sub.name === "Applications" && displayCounts.corApplications > 0 && (
                                  <span className="text-[9px] font-bold bg-white border border-[#ECDDBB] text-[#865E16] px-1.5 py-0.5 rounded-full">
                                    {displayCounts.corApplications}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#E8E8E3] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#FAF5EC] border border-[#ECDDBB] flex items-center justify-center text-xs font-semibold text-[#141413]">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E8E8E3] bg-white text-xs uppercase tracking-[0.08em] font-medium text-[#6E6E69] hover:text-[#B83838] hover:border-[#F2C6C6] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
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
            <Link href="/admin/overview" className="flex items-center gap-1 group">
              <span className="font-serif italic font-semibold text-2xl tracking-tight text-[#141413] group-hover:opacity-85 transition-opacity">
                Eras
              </span>
              <span className="font-serif font-medium text-xl tracking-tight text-[#141413]">
                Studio
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#865E16] mb-1 ml-0.5 inline-block" />
            </Link>
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#865E16] px-2.5 py-0.5 rounded-full border border-[#ECDDBB] bg-[#FAF5EC]">
              Admin
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#73736C] font-sans flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
              Platform
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isCor = item.href === "/admin/cor";
                const isCorActive = isCor && (pathname === "/admin/cor" || pathname.startsWith("/admin/cor/"));
                const isActive =
                  pathname === item.href ||
                  (!isCor && pathname.startsWith(`${item.href}/`)) ||
                  (isCor && pathname === "/admin/cor");
                return (
                  <div key={item.href} className="space-y-1">
                    <Link
                      href={item.href}
                      className={`group flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs md:text-sm font-medium transition-all duration-200 ${
                        isActive || (isCor && isCorActive)
                          ? "bg-[#141413] text-white shadow-xs"
                          : "text-[#6E6E69] hover:text-[#141413] hover:bg-[#FAF5EC]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 stroke-[1.75] transition-colors ${
                            isActive || (isCor && isCorActive)
                              ? "text-[#FAF5EC]"
                              : "text-[#8A8A85] group-hover:text-[#141413]"
                          }`}
                        />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.name === "Creators" && displayCounts.creators > 0 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ${
                              isActive || (isCor && isCorActive)
                                ? "bg-white text-[#141413]"
                                : "bg-[#FAF5EC] text-[#865E16] border border-[#ECDDBB]"
                            }`}
                          >
                            {displayCounts.creators}
                          </span>
                        )}
                        {item.name === "Artworks" && displayCounts.artworks > 0 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ${
                              isActive || (isCor && isCorActive)
                                ? "bg-white text-[#141413]"
                                : "bg-[#FAF5EC] text-[#865E16] border border-[#ECDDBB]"
                            }`}
                          >
                            {displayCounts.artworks}
                          </span>
                        )}
                        {item.name === "Reports" && displayCounts.reports > 0 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ${
                              isActive || (isCor && isCorActive)
                                ? "bg-white text-[#141413]"
                                : "bg-[#FAF5EC] text-[#865E16] border border-[#ECDDBB]"
                            }`}
                          >
                            {displayCounts.reports}
                          </span>
                        )}
                        {item.name === "COR" && displayTotalCor > 0 && !isCorActive && (
                          <span className="text-[10px] font-bold bg-[#FAF5EC] text-[#865E16] border border-[#ECDDBB] px-2 py-0.5 rounded-full min-w-[20px] text-center">
                            {displayTotalCor}
                          </span>
                        )}
                        {(isActive || (isCor && isCorActive)) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
                        )}
                      </div>
                    </Link>

                    {/* Render COR sub-nav when in COR section */}
                    {isCor && isCorActive && (
                      <div className="pl-5 pr-2 py-1 space-y-1 border-l-2 border-[#E8E8E3] ml-5 my-1">
                        {corSubNav.map((sub) => {
                          const isSubActive =
                            pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`flex items-center justify-between px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                isSubActive
                                  ? "bg-[#FAF5EC] text-[#865E16] font-semibold border border-[#ECDDBB]"
                                  : "text-[#6E6E69] hover:text-[#141413] hover:bg-[#FAF5EC]/60"
                              }`}
                            >
                              <span>{sub.name}</span>
                              {sub.name === "Requests" && displayCounts.corRequests > 0 && (
                                <span className="text-[9px] font-bold bg-white border border-[#ECDDBB] text-[#865E16] px-1.5 py-0.5 rounded-full">
                                  {displayCounts.corRequests}
                                </span>
                              )}
                              {sub.name === "Applications" && displayCounts.corApplications > 0 && (
                                <span className="text-[9px] font-bold bg-white border border-[#ECDDBB] text-[#865E16] px-1.5 py-0.5 rounded-full">
                                  {displayCounts.corApplications}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="mt-8 mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#73736C] font-sans flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
              Directory
            </div>
            <div className="space-y-1 text-xs">
              <Link
                href="/discovery"
                className="flex items-center justify-between px-3.5 py-2 rounded-full text-[#6E6E69] hover:text-[#141413] hover:bg-[#FAF5EC] transition-colors"
              >
                <span>Browse Gallery</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#8A8A85]" />
              </Link>
              <Link
                href="/about"
                className="flex items-center justify-between px-3.5 py-2 rounded-full text-[#6E6E69] hover:text-[#141413] hover:bg-[#FAF5EC] transition-colors"
              >
                <span>About Eras</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#8A8A85]" />
              </Link>
            </div>
          </div>

          {/* Sidebar Footer with Session & Logout */}
          <div className="p-4 border-t border-[#E8E8E3] bg-white">
            <div className="flex items-center justify-between p-2 rounded-2xl border border-transparent hover:border-[#E8E8E3] hover:bg-[#FAF5EC]/40 transition-all">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#FAF5EC] border border-[#ECDDBB] flex items-center justify-center text-xs font-semibold text-[#141413] shrink-0">
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
                className="p-2 rounded-full text-[#8A8A85] hover:text-[#B83838] hover:bg-[#FDF2F2] transition-colors ml-1 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#141413]"
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
        <main className="flex-1 flex flex-col min-w-0 bg-[#FAF5EC]">
          {/* Desktop Top Bar */}
          <header className="hidden lg:flex items-center justify-between h-16 px-8 border-b border-[#E8E8E3] bg-white/85 backdrop-blur-md sticky top-0 z-20">
            {/* Active Page Title */}
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#141413]">
                {currentPageTitle}
              </h1>
            </div>

            {/* Right Top Bar Controls: Supabase Pill, Admin Pill & Logout Button */}
            <div className="flex items-center gap-3">
              {/* Supabase Status Pill */}
              <div
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-xs text-[#6E6E69] shadow-2xs"
                title={
                  isBrowserSupabaseConfigured
                    ? "Connected to live Supabase database"
                    : "Using local in-memory dataset."
                }
              >
                <DbIcon className="w-3.5 h-3.5 text-[#865E16]" />
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isBrowserSupabaseConfigured
                      ? "bg-[#28633B] animate-pulse"
                      : "bg-[#865E16]"
                  }`}
                />
                <span className="font-medium text-[#141413]">
                  {isBrowserSupabaseConfigured ? "Supabase Live" : "DB: Local Mode"}
                </span>
              </div>

              {/* Admin Avatar Pill */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-xs text-[#141413] shadow-2xs">
                <div className="w-5 h-5 rounded-full bg-[#FAF5EC] border border-[#ECDDBB] flex items-center justify-center text-[10px] font-semibold text-[#141413]">
                  A
                </div>
                <span className="font-medium">Admin</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#28633B] ml-0.5" title="Online" />
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-label="Log out"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-xs uppercase tracking-[0.08em] font-medium text-[#141413] hover:text-[#B83838] hover:border-[#F2C6C6] hover:bg-[#FDF2F2] transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#141413] shadow-2xs"
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
