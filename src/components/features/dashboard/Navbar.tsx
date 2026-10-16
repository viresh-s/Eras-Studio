'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, LogOut, ChevronDown, User, Sparkles } from 'lucide-react';
import { logout } from '@/actions/authActions';
import type { Profile, UserRole } from '@/types/database';
import NotificationBell from './NotificationBell';

interface NavbarProps {
  profile: Pick<Profile, 'full_name' | 'profile_pic_url'> & {
    role: string;
    plan?: string | null;
    is_premium?: boolean | null;
  };
}

const navLinks = [
  { href: '/discovery', label: 'Discovery' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/cor', label: 'COR Hub' },
  { href: '/messages', label: 'Messages' },
  { href: '/profile', label: 'Profile' },
];

const userNavLinks = [
  { href: '/discovery', label: 'Discovery' },
  { href: '/cor', label: 'COR Hub' },
  { href: '/messages', label: 'Messages' },
  { href: '/purchases', label: 'Purchases' },
  { href: '/user/profile', label: 'Profile' },
];

const adminNavLinks = [
  { href: '/admin/overview', label: 'Admin Panel' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/artworks', label: 'Artworks' },
  { href: '/admin/cor', label: 'COR Ops' },
  { href: '/admin/reports', label: 'Reports' },
  { href: '/admin/subscriptions', label: 'Subscriptions' },
  { href: '/discovery', label: 'Discovery' },
  { href: '/cor', label: 'COR Hub' },
];

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();

  const rawPlan = profile.plan || (profile.is_premium ? 'pro' : 'free');
  const normalizedPlan = (rawPlan || 'free').toLowerCase().trim();
  const isPro = normalizedPlan === 'pro' || normalizedPlan === 'elite';
  const isLite = normalizedPlan === 'lite' || normalizedPlan === 'light';
  const planLabel = isPro ? 'Pro plan' : isLite ? 'Lite plan' : 'Free plan';

  const links =
    profile.role === 'Creator'
      ? navLinks
      : profile.role === 'Admin'
      ? adminNavLinks
      : userNavLinks;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-[var(--color-cor-surface)] border-b border-[var(--color-cor-border)] sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/discovery" className="flex items-center gap-1 flex-shrink-0">
            <span className="text-2xl font-semibold tracking-tight text-[var(--color-cor-ink)] font-serif italic">
              Eras
            </span>
            <span className="text-xl font-medium tracking-tight text-[var(--color-cor-ink)] font-serif">
              Studio
            </span>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== '/' && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-[var(--color-cor-ink)]'
                      : 'text-[var(--color-cor-ink-light)] hover:text-[var(--color-cor-ink)]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[var(--color-cor-ink)] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="relative flex items-center">
            <NotificationBell />
            
            <div className="relative flex items-center" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-full hover:bg-gray-50 transition-colors"
              >
              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 overflow-hidden flex-shrink-0">
                {profile.profile_pic_url ? (
                  <img
                    src={profile.profile_pic_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(profile.full_name)
                )}
              </div>

              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold text-[var(--color-cor-ink)] leading-tight">
                  {profile.full_name || 'Creator'}
                </p>
                <p className="text-xs text-[var(--color-cor-ink-light)] leading-tight flex items-center gap-1">
                  {planLabel}
                </p>
              </div>
              <ChevronDown size={14} className="text-[var(--color-cor-ink-light)] hidden lg:block" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[var(--color-cor-surface)] border border-[var(--color-cor-border)] rounded-2xl shadow-soft-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-[var(--color-cor-border-light)] mb-1 lg:hidden">
                  <p className="text-sm font-semibold text-[var(--color-cor-ink)] truncate">{profile.full_name}</p>
                  <p className="text-xs text-[var(--color-cor-ink-light)]">{planLabel}</p>
                </div>
                
                <Link
                  href={profile.role === 'Creator' ? '/profile' : '/user/profile'}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-cor-ink)] hover:bg-[#F4F4ED] transition-colors w-full text-left"
                >
                  <User size={16} /> Edit Profile
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-cor-ink)] hover:bg-[#F4F4ED] transition-colors w-full text-left"
                >
                  <Settings size={16} /> Account Settings
                </Link>

                <Link
                  href="/subscription"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-cor-ink)] hover:bg-[#F4F4ED] transition-colors w-full text-left"
                >
                  <Sparkles size={16} className="text-[#865E16]" /> Subscription
                </Link>

                <div className="h-px bg-[var(--color-cor-border-light)] my-1"></div>

                <form action={logout}>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-[#FAF5EC] transition-colors w-full text-left"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-t border-gray-100 overflow-x-auto">
        <div className="flex px-4">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'text-[var(--color-cor-ink)]'
                    : 'text-[var(--color-cor-ink-light)] hover:text-[var(--color-cor-ink)]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[var(--color-cor-ink)] rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
