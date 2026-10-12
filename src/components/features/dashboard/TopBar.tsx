'use client';

import Link from 'next/link';
import { LogOut, Menu, UserCircle } from 'lucide-react';
import { logout } from '@/actions/authActions';
import type { Profile } from '@/types/database';

interface TopBarProps {
  profile: Pick<Profile, 'full_name' | 'profile_pic_url'> & { role: string };
  onMenuToggle: () => void;
}

export default function TopBar({ profile, onMenuToggle }: TopBarProps) {
  const profileHref = profile.role === 'Creator' ? '/profile' : profile.role === 'Admin' ? '/admin/profile' : '/user/profile';

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>
        <h2 className="text-sm font-medium text-gray-500 hidden sm:block">
          Welcome, <span className="text-gray-900 font-semibold">{profile.full_name}</span>
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Avatar — clickable, goes to profile */}
        <Link
          href={profileHref}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-orange-300 flex items-center justify-center text-white font-bold text-sm shadow-sm overflow-hidden hover:ring-2 hover:ring-gray-300 transition-all"
          title="Edit Profile"
        >
          {profile.profile_pic_url ? (
            <img src={profile.profile_pic_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            profile.full_name?.charAt(0)?.toUpperCase() || '?'
          )}
        </Link>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-2 rounded-full text-gray-500 text-sm font-medium hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </form>
      </div>
    </header>
  );
}

