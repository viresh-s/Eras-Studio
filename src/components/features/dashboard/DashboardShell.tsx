'use client';

import { useState } from 'react';
import Sidebar from '@/components/features/dashboard/Sidebar';
import TopBar from '@/components/features/dashboard/TopBar';
import type { Profile, UserRole } from '@/types/database';

interface DashboardShellProps {
  profile: Pick<Profile, 'full_name' | 'profile_pic_url'> & { role: string };
  children: React.ReactNode;
}

export default function DashboardShell({ profile, children }: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-offwhite flex">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:sticky top-0 h-screen z-50 transition-transform duration-200 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <Sidebar
          role={profile.role as UserRole}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <TopBar
          profile={profile}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
