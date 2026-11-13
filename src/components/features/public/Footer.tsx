import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-[#141413] text-white">
      {/* Links Grid */}
      <div className="border-t border-[#262624]">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="hover:opacity-90 transition-opacity inline-flex items-center mb-1">
                <Image
                  src="/images/eras-logo.png"
                  alt="ERAS Studio"
                  width={140}
                  height={23}
                  className="h-7 sm:h-8 w-auto object-contain select-none"
                />
              </Link>
              <p className="mt-3 text-[#9E9E98] text-xs sm:text-sm leading-relaxed max-w-xs">
                A curated marketplace connecting independent creators with art patrons.
              </p>
            </div>

            {/* Explore */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Explore
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Gallery', href: '/discovery' },
                  { label: 'Artists', href: '/discovery' },
                  { label: 'Artworks', href: '/discovery' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Company
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'About', href: '/about' },
                  { label: 'Services', href: '/services' },
                  { label: 'FAQ', href: '/faq' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Support
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Contact', href: '/contact' },
                  { label: 'Privacy Policy', href: '/faq' },
                  { label: 'Terms of Service', href: '/faq' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#262624]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Eras Studio. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/faq" className="text-gray-500 hover:text-white text-xs transition-colors">
              Privacy Policy
            </Link>
            <Link href="/faq" className="text-gray-500 hover:text-white text-xs transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
