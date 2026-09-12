'use client';

import { LogOut, Menu } from 'lucide-react';
import { logout } from '@/actions/authActions';
import type { Profile } from '@/types/database';

interface TopBarProps {
  profile: Pick<Profile, 'full_name' | 'profile_pic_url'> & { role: string };
  onMenuToggle: () => void;
}

export default function TopBar({ profile, onMenuToggle }: TopBarProps) {
  return (
    <header className="border-b-4 border-brand-black bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 border-2 border-brand-black hover:bg-brand-yellow transition-colors lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={18} />
        </button>
        <h2 className="font-heading text-lg font-bold hidden sm:block">
          Welcome, <span className="text-brand-blue">{profile.full_name}</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-9 h-9 border-2 border-brand-black bg-brand-pink flex items-center justify-center font-heading font-bold text-sm">
          {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
        </div>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 px-3 py-2 border-2 border-brand-black font-heading font-semibold text-sm hover:bg-brand-red hover:text-white transition-all"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </form>
      </div>
    </header>
  );
}
