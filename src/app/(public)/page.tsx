import Link from 'next/link';
import Card from '@/components/ui/Card';
import { Palette, ShoppingBag, MessageCircle, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="border-b-4 border-brand-black bg-white">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-block mb-4 px-4 py-2 border-3 border-brand-black bg-brand-yellow shadow-brutal-sm font-heading font-bold text-sm uppercase tracking-widest">
              Art Marketplace
            </div>
            <h1 className="font-heading text-5xl md:text-7xl font-bold leading-tight mb-6">
              Where Art
              <br />
              Meets Its{' '}
              <span className="bg-brand-pink px-3 border-3 border-brand-black inline-block -rotate-1">
                Collector
              </span>
            </h1>
            <p className="text-xl text-brand-gray leading-relaxed mb-8 max-w-xl">
              ERAS connects talented artists with passionate collectors.
              Discover extraordinary works, connect directly with creators,
              and build your collection.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/browse" className="btn-brutal btn-brutal-lg">
                Browse Artworks
                <ArrowRight size={20} />
              </Link>
              <Link href="/signup" className="btn-brutal btn-brutal-lg btn-brutal-pink">
                Join as Creator
                <Palette size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 border-b-4 border-brand-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-4xl font-bold mb-4">What We Do</h2>
            <p className="text-brand-gray text-lg max-w-2xl mx-auto">
              A seamless bridge between creative vision and art collection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <div className="inline-flex p-4 border-3 border-brand-black bg-brand-yellow mb-4">
                <Palette size={32} />
              </div>
              <h3 className="font-heading text-xl font-bold mb-2">For Creators</h3>
              <p className="text-brand-gray leading-relaxed">
                Upload your artworks, manage your portfolio, and connect
                directly with interested collectors. Your art, your terms.
              </p>
            </Card>

            <Card className="text-center">
              <div className="inline-flex p-4 border-3 border-brand-black bg-brand-pink mb-4">
                <ShoppingBag size={32} />
              </div>
              <h3 className="font-heading text-xl font-bold mb-2">For Collectors</h3>
              <p className="text-brand-gray leading-relaxed">
                Browse curated artworks, filter by type and artist, and
                express interest directly. Find pieces that speak to you.
              </p>
            </Card>

            <Card className="text-center">
              <div className="inline-flex p-4 border-3 border-brand-black bg-brand-blue text-white mb-4">
                <MessageCircle size={32} />
              </div>
              <h3 className="font-heading text-xl font-bold mb-2">Direct Connection</h3>
              <p className="text-brand-gray leading-relaxed">
                Real-time messaging between creators and collectors.
                No middlemen, no barriers — just art and conversation.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why ERAS */}
      <section className="py-20 border-b-4 border-brand-black bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-4xl font-bold mb-6">
                Why Choose{' '}
                <span className="bg-brand-yellow px-2 border-2 border-brand-black">ERAS</span>?
              </h2>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="p-2 border-2 border-brand-black bg-brand-green flex-shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-lg">Curated Experience</h4>
                    <p className="text-brand-gray">Every artwork is hand-uploaded by verified creators</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 border-2 border-brand-black bg-brand-blue text-white flex-shrink-0">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-lg">Secure & Direct</h4>
                    <p className="text-brand-gray">Chat directly with creators — no intermediaries</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 border-2 border-brand-black bg-brand-pink flex-shrink-0">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-lg">Free to Start</h4>
                    <p className="text-brand-gray">Creators get 3 free uploads and a 10-day trial</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-4 border-brand-black bg-brand-offwhite shadow-brutal-lg p-8">
              <div className="space-y-4">
                <div className="h-6 bg-brand-yellow border-2 border-brand-black w-3/4" />
                <div className="h-6 bg-brand-pink border-2 border-brand-black w-1/2" />
                <div className="h-6 bg-brand-blue border-2 border-brand-black w-5/6" />
                <div className="h-6 bg-brand-green border-2 border-brand-black w-2/3" />
                <div className="mt-6 text-center">
                  <p className="font-heading font-bold text-2xl">100+</p>
                  <p className="text-brand-gray text-sm">Artworks & Growing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-brand-yellow border-b-4 border-brand-black">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading text-4xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-lg mb-8">
            Whether you&apos;re a creator looking to showcase your work or a collector
            seeking your next masterpiece — ERAS is your platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/signup" className="btn-brutal btn-brutal-lg btn-brutal-black">
              Create Account
              <ArrowRight size={20} />
            </Link>
            <Link href="/browse" className="btn-brutal btn-brutal-lg btn-brutal-white">
              Explore Gallery
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
