'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, LogOut, ChevronDown, User, Sparkles } from 'lucide-react';
import { logout } from '@/actions/authActions';
import type { Profile, UserRole } from '@/types/database';

interface NavbarProps {
  profile: Pick<Profile, 'full_name' | 'profile_pic_url'> & { role: string };
}

const navLinks = [
  { href: '/browse', label: 'Discovery' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/messages', label: 'Messages' },
  { href: '/profile', label: 'Profile' },
];

const userNavLinks = [
  { href: '/user', label: 'Discovery' },
  { href: '/browse', label: 'Browse' },
  { href: '/messages', label: 'Messages' },
  { href: '/user/profile', label: 'Profile' },
];

const adminNavLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/artworks', label: 'Artworks' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/messages', label: 'Messages' },
  { href: '/admin/profile', label: 'Profile' },
];

export default function Navbar({ profile }: NavbarProps) {
  const pathname = usePathname();

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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xl font-extrabold tracking-tight text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Eras
            </span>
            <span className="text-xl font-normal tracking-tight text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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
                      ? 'text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gray-900 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
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
                <p className="text-sm font-semibold text-gray-900 leading-tight">
                  {profile.full_name || 'Creator'}
                </p>
                <p className="text-xs text-gray-500 leading-tight flex items-center gap-1">
                  Free plan
                </p>
              </div>
              <ChevronDown size={14} className="text-gray-400 hidden lg:block" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-gray-100 mb-1 lg:hidden">
                  <p className="text-sm font-semibold text-gray-900 truncate">{profile.full_name}</p>
                  <p className="text-xs text-gray-500">Free plan</p>
                </div>
                
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-left"
                >
                  <User size={16} /> Edit Profile
                </Link>

                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed w-full text-left opacity-70"
                >
                  <Sparkles size={16} /> Upgrade (Coming Soon)
                </button>

                <div className="h-px bg-gray-100 my-1"></div>

                <form action={logout}>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut size={16} /> Sign out
                  </button>
                </form>
              </div>
            )}
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
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gray-900 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
