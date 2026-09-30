import Link from 'next/link';
import { Crown, Infinity, Zap, BarChart3, Star, CheckCircle, ArrowRight } from 'lucide-react';

export default function ServicesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-full text-sm font-semibold text-pink-700 mb-5">
            <Crown size={14} />
            For Creators
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-5">Premium Services</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Unlock the full power of Eras Studio and take your art business to the next level
          </p>
        </div>
      </section>

      {/* Free vs Premium */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Free Plan</h3>
              <p className="text-gray-500 text-sm mb-6">Get started at no cost</p>
              <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-center">
                <p className="text-4xl font-extrabold text-gray-900">$0</p>
                <p className="text-gray-400 text-sm">forever</p>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  'Up to 3 artwork uploads',
                  '10-day full access trial',
                  '1-1 messaging with collectors',
                  'Basic profile page',
                  'Browse and discover art',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full text-center px-6 py-3 rounded-full border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
                Get Started Free
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="relative">
              <div className="absolute -top-3 right-6 px-4 py-1.5 bg-accent-coral text-white rounded-full text-xs font-bold">
                POPULAR
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.08)] border border-gray-100 h-full">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Premium</h3>
                <p className="text-gray-500 text-sm mb-6">Everything you need to grow</p>
                <div className="bg-gray-900 rounded-2xl p-5 mb-6 text-center">
                  <p className="text-4xl font-extrabold text-white">Pro</p>
                  <p className="text-gray-400 text-sm">coming soon</p>
                </div>
                <ul className="space-y-3 mb-6">
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
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <Star size={16} className="text-amber-400 flex-shrink-0" />
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all hover:scale-[1.02]">
                  <Crown size={16} />
                  Join Premium Waitlist
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 text-center mb-12">Premium Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl p-6 text-center shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                <Infinity size={20} className="text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900">Unlimited Uploads</h4>
              <p className="text-gray-500 text-xs mt-1">No caps on your creativity</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
                <Zap size={20} className="text-amber-600" />
              </div>
              <h4 className="font-bold text-gray-900">Priority Listing</h4>
              <p className="text-gray-500 text-xs mt-1">Your art shows up first</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-3">
                <BarChart3 size={20} className="text-pink-600" />
              </div>
              <h4 className="font-bold text-gray-900">Analytics</h4>
              <p className="text-gray-500 text-xs mt-1">Track views & engagement</p>
            </div>
            <div className="bg-white rounded-2xl p-6 text-center shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <Star size={20} className="text-emerald-600" />
              </div>
              <h4 className="font-bold text-gray-900">Verified Badge</h4>
              <p className="text-gray-500 text-xs mt-1">Stand out as verified</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-5">Start Creating Today</h2>
          <p className="text-lg text-gray-500 mb-8">
            Join Eras Studio for free and start showcasing your work to collectors worldwide.
          </p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition-all hover:scale-[1.02]">
            Create Your Account
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
