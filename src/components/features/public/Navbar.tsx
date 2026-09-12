'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/browse', label: 'Browse Art' },
  { href: '/services', label: 'Services' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="border-b-4 border-brand-black bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-heading text-2xl font-bold tracking-tight">
          ERAS<span className="text-brand-yellow">.</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 font-heading font-semibold text-sm border-2 transition-all ${
                pathname === link.href
                  ? 'border-brand-black bg-brand-yellow shadow-brutal-sm'
                  : 'border-transparent hover:border-brand-black hover:bg-brand-lightgray'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="btn-brutal btn-brutal-sm btn-brutal-white">
            Log In
          </Link>
          <Link href="/signup" className="btn-brutal btn-brutal-sm">
            Sign Up
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 border-2 border-brand-black hover:bg-brand-yellow"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t-4 border-brand-black bg-white px-6 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 font-heading font-semibold border-2 transition-all ${
                pathname === link.href
                  ? 'border-brand-black bg-brand-yellow'
                  : 'border-transparent hover:border-brand-black'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t-2 border-brand-black flex gap-3">
            <Link href="/login" className="btn-brutal btn-brutal-sm btn-brutal-white flex-1 text-center">
              Log In
            </Link>
            <Link href="/signup" className="btn-brutal btn-brutal-sm flex-1 text-center">
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
