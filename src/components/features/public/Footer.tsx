import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#141413] text-white">
      {/* Links Grid */}
      <div className="border-t border-[#262624]">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Eras Studio</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#865E16] inline-block mb-1"></span>
              </Link>
              <p className="mt-3 text-[#9E9E98] text-sm leading-relaxed max-w-xs">
                Where art meets its collector. An editorial marketplace connecting independent creators with passionate art patrons worldwide.
              </p>
            </div>

            {/* Explore */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Explore
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Browse Art', href: '/discovery' },
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

            {/* For Creators */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                For Creators
              </h4>
              <ul className="space-y-2.5">
                {['Sign Up', 'Upload Artworks', 'Premium Plans', 'Creator FAQ'].map((label) => (
                  <li key={label}>
                    <Link href="/signup" className="text-gray-400 hover:text-white transition-colors text-sm">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
                Connect
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a href="mailto:hello@eras.art" className="text-gray-400 hover:text-white transition-colors text-sm">
                    hello@eras.art
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-800">
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
