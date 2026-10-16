'use client';

import Navbar from '@/components/features/dashboard/Navbar';
import Footer from '@/components/features/dashboard/Footer';
import type { Profile, UserRole } from '@/types/database';

interface DashboardShellProps {
  profile: Pick<Profile, 'full_name' | 'profile_pic_url'> & {
    role: string;
    plan?: string | null;
    is_premium?: boolean | null;
  };
  children: React.ReactNode;
}

export default function DashboardShell({ profile, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-cor-bg)]">
      <Navbar profile={profile} />
      <main className="max-w-[1400px] mx-auto px-6 py-8 flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
