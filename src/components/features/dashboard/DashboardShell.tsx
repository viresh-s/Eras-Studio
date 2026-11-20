'use client';

import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  // Apply 20px padding exclusively to the main portfolio page, excluding sub-pages and other routes
  const isOnlyPortfolioPage = pathname === '/portfolio' || pathname === '/portfolio/';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-cor-bg)]">
      <Navbar profile={profile} />
      <main
        className={`max-w-[1400px] mx-auto flex-1 w-full overflow-x-hidden ${
          isOnlyPortfolioPage ? 'p-[20px]' : 'px-4 sm:px-6 py-5 sm:py-8'
        }`}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
