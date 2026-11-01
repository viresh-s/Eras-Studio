import Link from 'next/link';
import { Crown, ArrowRight } from 'lucide-react';

export default function ServicesPage() {
  return (
    <div className="py-20 text-[#141413]">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold font-serif tracking-tight text-[#141413]">
          Premium Services
        </h1>
      </section>

      {/* Free vs Premium */}
      <section className="mb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-3xl p-8 border border-[#E8E8E3] shadow-xs">
              <h3 className="text-2xl font-serif font-bold text-[#141413] mb-6">Free Plan</h3>
              <div className="bg-[#FAF9F6] border border-[#E8E8E3] rounded-2xl p-5 mb-8 text-center">
                <p className="text-4xl font-serif font-bold text-[#141413]">₹0</p>
                <p className="text-xs uppercase tracking-wider text-[#6E6E69] mt-1 font-mono">Standard</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Up to 3 artwork uploads',
                  '1-1 messaging with collectors',
                  'Basic profile page',
                  'Browse and discover art',
                ].map((feature) => (
                  <li key={feature} className="text-sm text-[#555550]">
                    — {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center px-6 py-3 rounded-full border border-[#141413] text-[#141413] text-xs uppercase tracking-[0.08em] font-medium hover:bg-[#141413] hover:text-white transition-all duration-200"
              >
                Get Started Free
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="relative">
              <div className="bg-white rounded-3xl p-8 border border-[#141413] shadow-md h-full">
                <h3 className="text-2xl font-serif font-bold text-[#141413] mb-6">Premium</h3>
                <div className="bg-[#141413] text-white rounded-2xl p-5 mb-8 text-center">
                  <p className="text-4xl font-serif font-bold text-white">Pro</p>
                  <p className="text-xs uppercase tracking-wider text-[#A0A09B] mt-1 font-mono">Curated Tier</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {[
                    'Unlimited artwork uploads',
                    'Priority listing in search',
                    'Verified creator badge',
                    'Analytics dashboard',
                    'Advanced profile customization',
                    'Priority support',
                    'Featured on homepage',
                    'Portfolio integration',
                  ].map((feature) => (
                    <li key={feature} className="text-sm text-[#141413] font-medium">
                      — {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full bg-[#141413] text-white text-xs uppercase tracking-[0.08em] font-medium hover:bg-black transition-all duration-200 cursor-pointer"
                >
                  <Crown size={15} />
                  <span>Join Premium Waitlist</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-[#FAFAFA] border-y border-[#E8E8E3] mb-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-serif font-bold tracking-tight text-[#141413] text-center mb-12">
            Premium Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-6 text-center border border-[#E8E8E3]">
              <h4 className="font-serif font-bold text-[#141413]">Unlimited Uploads</h4>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border border-[#E8E8E3]">
              <h4 className="font-serif font-bold text-[#141413]">Priority Listing</h4>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border border-[#E8E8E3]">
              <h4 className="font-serif font-bold text-[#141413]">Analytics</h4>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center border border-[#E8E8E3]">
              <h4 className="font-serif font-bold text-[#141413]">Verified Badge</h4>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-serif font-bold tracking-tight text-[#141413] mb-8">
          Start Creating Today
        </h2>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#141413] text-white rounded-full text-xs uppercase tracking-[0.08em] font-medium hover:bg-black transition-all duration-200 group"
        >
          <span>Create Your Account</span>
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </section>
    </div>
  );
}
