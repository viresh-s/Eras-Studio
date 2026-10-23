'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/discovery', label: 'Browse Art' },
  { href: '/services', label: 'Services' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E8E8E3]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-[#141413] hover:opacity-80 transition-opacity flex items-center gap-2">
          <span>Eras Studio</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#865E16] inline-block mb-1"></span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                pathname === link.href
                  ? 'bg-[#141413] text-white'
                  : 'text-[#6E6E69] hover:text-[#141413] hover:bg-black/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" className="px-4 py-1.5 text-xs uppercase tracking-[0.08em] font-medium text-[#6E6E69] hover:text-[#141413] transition-colors">
            Log In
          </Link>
          <Link href="/signup" className="px-5 py-2 text-xs uppercase tracking-[0.08em] font-medium bg-[#141413] text-white border border-[#141413] rounded-full hover:bg-transparent hover:text-[#141413] transition-all duration-200">
            Sign Up
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl text-[#141413] hover:bg-black/5 transition-colors"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E8E8E3] bg-white px-6 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                pathname === link.href
                  ? 'bg-[#141413] text-white'
                  : 'text-[#6E6E69] hover:bg-black/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 mt-2 border-t border-[#E8E8E3] flex gap-3">
            <Link href="/login" className="flex-1 text-center px-4 py-2 text-xs uppercase tracking-[0.08em] font-medium rounded-full border border-[#E8E8E3] text-[#141413] hover:bg-black/5 transition-colors">
              Log In
            </Link>
            <Link href="/signup" className="flex-1 text-center px-4 py-2 text-xs uppercase tracking-[0.08em] font-medium rounded-full bg-[#141413] text-white border border-[#141413] hover:bg-transparent hover:text-[#141413] transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
