'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Settings, ChevronDown, User, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Client signOut notice:', err);
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Server signOut notice:', err);
    }
    window.location.href = '/login';
  };

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
          <Link href="/discovery" className="flex items-center flex-shrink-0 hover:opacity-90 transition-opacity">
            <Image
              src="/images/eras-logo.png"
              alt="ERAS Studio"
              width={140}
              height={23}
              className="h-7 w-auto object-contain select-none"
              priority
            />
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
          <div className="relative flex items-center gap-1 sm:gap-2">
            <NotificationBell />
            
            <div className="relative flex items-center" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
              >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-600 overflow-hidden shrink-0">
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
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-cor-ink)] hover:bg-[#F5F5F5] transition-colors w-full text-left"
                >
                  <User size={16} /> Edit Profile
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-cor-ink)] hover:bg-[#F5F5F5] transition-colors w-full text-left"
                >
                  <Settings size={16} /> Account Settings
                </Link>

                <Link
                  href="/subscription"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-cor-ink)] hover:bg-[#F5F5F5] transition-colors w-full text-left"
                >
                  Subscription
                </Link>

                <div className="h-px bg-[var(--color-cor-border-light)] my-1"></div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-[#FDF2F2] transition-colors w-full text-left cursor-pointer disabled:opacity-50"
                >
                  <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[var(--color-cor-ink)] hover:bg-gray-100 transition-colors ml-1 cursor-pointer flex items-center justify-center min-w-[40px] min-h-[40px]"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-out Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-[300px] max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between z-50 animate-in slide-in-from-right duration-250 border-l border-[#E8E8E3]">
            {/* Top: Header & User Info */}
            <div className="p-5 border-b border-[#F0F0EB]">
              <div className="flex items-center justify-between mb-4">
                <Link href="/discovery" onClick={() => setMobileMenuOpen(false)}>
                  <Image
                    src="/images/eras-logo.png"
                    alt="ERAS Studio"
                    width={110}
                    height={18}
                    className="h-5 w-auto object-contain"
                  />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-full text-gray-500 hover:text-[#141413] hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Profile Capsule in Drawer */}
              <div className="flex items-center gap-3 pt-2">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 overflow-hidden shrink-0">
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
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#141413] truncate">
                    {profile.full_name || 'Creator'}
                  </p>
                  <p className="text-xs text-[#6E6E69] truncate">
                    {planLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Middle: Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-[#8E8E88]">
                Navigation
              </p>
              {links.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== '/' && pathname.startsWith(link.href));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#141413] text-white'
                        : 'text-[#4A4A46] hover:bg-gray-100 hover:text-[#141413]'
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </Link>
                );
              })}

              <div className="h-px bg-[#F0F0EB] my-3" />

              <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-[#8E8E88]">
                Account
              </p>
              <Link
                href={profile.role === 'Creator' ? '/profile' : '/user/profile'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm text-[#4A4A46] hover:bg-gray-100 hover:text-[#141413] transition-colors"
              >
                <User size={16} />
                <span>Edit Profile</span>
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm text-[#4A4A46] hover:bg-gray-100 hover:text-[#141413] transition-colors"
              >
                <Settings size={16} />
                <span>Account Settings</span>
              </Link>
              <Link
                href="/subscription"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-sm text-[#4A4A46] hover:bg-gray-100 hover:text-[#141413] transition-colors"
              >
                <span>Subscription</span>
              </Link>
            </div>

            {/* Bottom: Logout */}
            <div className="p-4 border-t border-[#F0F0EB] bg-gray-50/50">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                disabled={isLoggingOut}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left flex items-center justify-between cursor-pointer disabled:opacity-50"
              >
                <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
