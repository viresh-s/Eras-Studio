import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white">
      {/* Links Grid */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="text-xl font-extrabold tracking-tight">
                Eras Studio
              </Link>
              <p className="mt-3 text-gray-400 text-sm leading-relaxed max-w-xs">
                Where art meets its collector. Connecting talented creators with passionate art enthusiasts worldwide.
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
