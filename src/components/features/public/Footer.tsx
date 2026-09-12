import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t-4 border-brand-black bg-brand-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="font-heading text-3xl font-bold">
              ERAS<span className="text-brand-yellow">.</span>
            </Link>
            <p className="mt-3 text-gray-400 text-sm leading-relaxed">
              Where art meets its collector. Connecting talented creators with passionate art enthusiasts worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-widest mb-4 text-brand-yellow">
              Explore
            </h4>
            <ul className="space-y-2">
              {['Browse Art', 'About ERAS', 'Services', 'FAQ'].map((label) => (
                <li key={label}>
                  <Link
                    href={`/${label.toLowerCase().replace(/\s+/g, '-').replace('eras', 'about')}`}
                    className="text-gray-400 hover:text-brand-yellow transition-colors text-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Creators */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-widest mb-4 text-brand-pink">
              For Creators
            </h4>
            <ul className="space-y-2">
              {['Sign Up as Creator', 'Upload Artworks', 'Premium Plans', 'Creator FAQ'].map((label) => (
                <li key={label}>
                  <Link
                    href="/signup"
                    className="text-gray-400 hover:text-brand-pink transition-colors text-sm"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-widest mb-4 text-brand-blue">
              Connect
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-brand-blue transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="mailto:hello@eras.art" className="text-gray-400 hover:text-brand-blue transition-colors text-sm">
                  hello@eras.art
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} ERAS. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/faq" className="text-gray-500 hover:text-white text-sm">
              Privacy
            </Link>
            <Link href="/faq" className="text-gray-500 hover:text-white text-sm">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
