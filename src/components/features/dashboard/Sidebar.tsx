'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  Image,
  MessageCircle,
  UserCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  BarChart3,
} from 'lucide-react';
import type { UserRole } from '@/types/database';

interface SidebarProps {
  role: UserRole;
  isCollapsed: boolean;
  onToggle: () => void;
}

const creatorLinks = [
  { href: '/creator', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/creator/artworks', label: 'My Artworks', icon: Image },
  { href: '/creator/upload', label: 'Upload', icon: Upload },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/creator/profile', label: 'Profile', icon: UserCircle },
];

const userLinks = [
  { href: '/user', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/browse', label: 'Browse Art', icon: Search },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/user/profile', label: 'Profile', icon: UserCircle },
];

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/artworks', label: 'Artworks', icon: Image },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/admin/profile', label: 'Profile', icon: UserCircle },
];

export default function Sidebar({ role, isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const links = role === 'Creator' ? creatorLinks : role === 'Admin' ? adminLinks : userLinks;

  return (
    <aside
      className={`border-r-4 border-brand-black bg-white flex flex-col transition-all duration-200 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="border-b-4 border-brand-black p-4 flex items-center justify-between">
        {!isCollapsed && (
          <Link href="/" className="font-heading text-xl font-bold">
            ERAS<span className="text-brand-yellow">.</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 border-2 border-brand-black hover:bg-brand-yellow transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Role badge */}
      <div className={`px-4 py-2 border-b-4 border-brand-black ${
        role === 'Creator' ? 'bg-brand-pink' : role === 'Admin' ? 'bg-brand-yellow' : 'bg-brand-blue text-white'
      }`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            {role === 'Admin' && <Shield size={14} />}
            <span className="font-heading text-xs font-bold uppercase tracking-widest">
              {role}
            </span>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center">
            <span className="font-heading text-xs font-bold">{role[0]}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 font-medium transition-all border-l-4 ${
                    isActive
                      ? 'border-brand-black bg-brand-yellow font-bold'
                      : 'border-transparent hover:border-brand-black hover:bg-brand-lightgray'
                  }`}
                  title={isCollapsed ? link.label : undefined}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!isCollapsed && <span>{link.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
