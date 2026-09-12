import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Crown, Infinity, Zap, BarChart3, Star, CheckCircle, ArrowRight } from 'lucide-react';

export default function ServicesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b-4 border-brand-black bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="inline-block mb-4 px-4 py-2 border-3 border-brand-black bg-brand-pink font-heading font-bold text-sm uppercase tracking-widest">
            For Creators
          </div>
          <h1 className="font-heading text-5xl font-bold mb-4">Premium Services</h1>
          <p className="text-xl text-brand-gray max-w-2xl mx-auto">
            Unlock the full power of ERAS and take your art business to the next level
          </p>
        </div>
      </section>

      {/* Free vs Premium */}
      <section className="py-16 border-b-4 border-brand-black">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <Card>
              <h3 className="font-heading text-2xl font-bold mb-1">Free Plan</h3>
              <p className="text-brand-gray mb-6">Get started at no cost</p>
              <div className="border-4 border-brand-black bg-brand-offwhite p-4 mb-6 text-center">
                <p className="font-heading text-4xl font-bold">$0</p>
                <p className="text-brand-gray text-sm">forever</p>
              </div>
              <ul className="space-y-3">
                {[
                  'Up to 3 artwork uploads',
                  '10-day full access trial',
                  '1-1 messaging with collectors',
                  'Basic profile page',
                  'Browse and discover art',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckCircle size={16} className="text-brand-green flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn-brutal btn-brutal-white w-full text-center mt-6 block">
                Get Started Free
              </Link>
            </Card>

            {/* Premium Plan */}
            <div className="relative">
              <div className="absolute -top-3 -right-3 px-4 py-1 border-3 border-brand-black bg-brand-yellow font-heading font-bold text-sm z-10">
                POPULAR
              </div>
              <Card className="border-brand-blue bg-white h-full">
                <h3 className="font-heading text-2xl font-bold mb-1">Premium</h3>
                <p className="text-brand-gray mb-6">Everything you need to grow</p>
                <div className="border-4 border-brand-black bg-brand-blue text-white p-4 mb-6 text-center">
                  <p className="font-heading text-4xl font-bold">Pro</p>
                  <p className="text-blue-200 text-sm">coming soon</p>
                </div>
                <ul className="space-y-3">
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
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Star size={16} className="text-brand-yellow flex-shrink-0" />
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="btn-brutal btn-brutal-blue w-full text-center mt-6 block">
                  <Crown size={18} />
                  Join Premium Waitlist
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white border-b-4 border-brand-black">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-heading text-3xl font-bold text-center mb-10">Premium Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="text-center bg-brand-offwhite">
              <Infinity size={32} className="mx-auto mb-3 text-brand-blue" />
              <h4 className="font-heading font-bold">Unlimited Uploads</h4>
              <p className="text-brand-gray text-sm mt-1">No caps on your creativity</p>
            </Card>
            <Card className="text-center bg-brand-offwhite">
              <Zap size={32} className="mx-auto mb-3 text-brand-yellow" />
              <h4 className="font-heading font-bold">Priority Listing</h4>
              <p className="text-brand-gray text-sm mt-1">Your art shows up first</p>
            </Card>
            <Card className="text-center bg-brand-offwhite">
              <BarChart3 size={32} className="mx-auto mb-3 text-brand-pink" />
              <h4 className="font-heading font-bold">Analytics</h4>
              <p className="text-brand-gray text-sm mt-1">Track views & engagement</p>
            </Card>
            <Card className="text-center bg-brand-offwhite">
              <Star size={32} className="mx-auto mb-3 text-brand-green" />
              <h4 className="font-heading font-bold">Verified Badge</h4>
              <p className="text-brand-gray text-sm mt-1">Stand out as verified</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-pink border-b-4 border-brand-black">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading text-4xl font-bold mb-4">Start Creating Today</h2>
          <p className="text-lg mb-8">
            Join ERAS for free and start showcasing your work to collectors worldwide.
          </p>
          <Link href="/signup" className="btn-brutal btn-brutal-lg btn-brutal-black">
            Create Your Account
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
