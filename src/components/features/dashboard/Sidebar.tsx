'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
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

import { Settings as SettingsIcon } from 'lucide-react';

const creatorLinks = [
  { href: '/portfolio', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portfolio/artworks', label: 'My Artworks', icon: Image },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
];

const userLinks = [
  { href: '/user', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/discovery', label: 'Browse Art', icon: Search },
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

const roleBadgeClasses: Record<string, string> = {
  Creator: 'bg-pink-50 text-pink-700',
  Admin: 'bg-amber-50 text-amber-700',
  User: 'bg-blue-50 text-blue-700',
};

export default function Sidebar({ role, isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const links = role === 'Creator' ? creatorLinks : role === 'Admin' ? adminLinks : userLinks;

  return (
    <aside
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-200 h-full ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="border-b border-gray-100 p-4 flex items-center justify-between">
        {!isCollapsed && (
          <Link href="/" className="text-lg font-extrabold tracking-tight text-gray-900">
            Eras Studio
          </Link>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Role badge */}
      <div className="px-4 py-3 border-b border-gray-100">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            {role === 'Admin' && <Shield size={14} className="text-amber-600" />}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${roleBadgeClasses[role] || roleBadgeClasses.User}`}>
              {role}
            </span>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${roleBadgeClasses[role] || roleBadgeClasses.User}`}>
              {role[0]}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3">
        <ul className="space-y-1 px-2 relative">
          {links.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <li key={link.href} className="relative">
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-gray-900 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Link
                  href={link.href}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title={isCollapsed ? link.label : undefined}
                >
                  <Icon size={18} className="flex-shrink-0 z-10" />
                  {!isCollapsed && <span className="z-10">{link.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
