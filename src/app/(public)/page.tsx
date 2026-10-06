import Link from 'next/link';
import { ArrowRight, Sparkles, Shield, Zap, Palette, ShoppingBag, MessageCircle } from 'lucide-react';
import Marquee from 'react-fast-marquee';
import HeroStack from '@/components/features/public/HeroStack';
import AvatarCloud from '@/components/features/public/AvatarCloud';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-36 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="z-20">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-50 rounded-full text-sm font-semibold text-gray-900 mb-8 border border-gray-100 shadow-sm">
                <Sparkles size={16} className="text-accent-coral" />
                The Future of Art Collecting
              </div>
              <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight leading-[1] text-gray-900 mb-8">
                Where Art
                <br />
                Meets Its
                <br />
                <span className="text-accent-coral">Collector</span>
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-lg">
                Eras Studio connects talented artists with passionate collectors.
                Discover extraordinary works, connect directly with creators,
                and build your collection.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/discovery"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full text-base font-semibold hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Browse Artworks
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-gray-200 text-gray-900 rounded-full text-base font-semibold hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Join as Creator
                  <Palette size={18} />
                </Link>
              </div>
            </div>

            {/* Animated Hero Stack */}
            <div className="w-full flex justify-center lg:justify-end">
              <HeroStack />
            </div>
          </div>
        </div>
      </section>

      {/* Scrolling Marquee */}
      <section className="bg-accent-yellow py-5 border-y border-gray-100/10">
        <Marquee speed={40} gradient={false} autoFill>
          <div className="flex items-center gap-8 text-gray-900 font-extrabold text-2xl px-4 tracking-tight uppercase">
            <span>Artists can ride 🎨</span>
            <span className="text-xl text-gray-900/40">•</span>
            <span>Inspired by people 🌼</span>
            <span className="text-xl text-gray-900/40">•</span>
            <span>Collect what you love 💛</span>
            <span className="text-xl text-gray-900/40">•</span>
            <span>Direct connection ✨</span>
            <span className="text-xl text-gray-900/40">•</span>
            <span>No middlemen 🚀</span>
            <span className="text-xl text-gray-900/40">•</span>
          </div>
        </Marquee>
      </section>

      {/* Floating Avatars Section */}
      <section className="bg-gray-50 border-b border-gray-100">
        <AvatarCloud />
      </section>

      {/* What We Do */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">What We Do</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              A seamless bridge between creative vision and art collection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-[32px] p-10 shadow-[0_2px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 group border border-gray-50">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110">
                <Palette size={28} className="text-rose-600" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-4 tracking-tight">For Creators</h3>
              <p className="text-gray-500 leading-relaxed">
                Upload your artworks, manage your portfolio, and connect
                directly with interested collectors. Your art, your terms.
              </p>
            </div>

            <div className="bg-white rounded-[32px] p-10 shadow-[0_2px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 group border border-gray-50">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110">
                <ShoppingBag size={28} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-4 tracking-tight">For Collectors</h3>
              <p className="text-gray-500 leading-relaxed">
                Browse curated artworks, filter by type and artist, and
                express interest directly. Find pieces that speak to you.
              </p>
            </div>

            <div className="bg-white rounded-[32px] p-10 shadow-[0_2px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 group border border-gray-50">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110">
                <MessageCircle size={28} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-4 tracking-tight">Direct Connection</h3>
              <p className="text-gray-500 leading-relaxed">
                Real-time messaging between creators and collectors.
                No middlemen, no barriers — just art and conversation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Eras Studio */}
      <section className="py-32 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-10 leading-[1.1]">
                Why Choose
                <br />
                <span className="text-accent-coral"> Eras Studio</span>?
              </h2>

              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100">
                    <Sparkles size={20} className="text-gray-900" />
                  </div>
                  <div className="pt-1">
                    <h4 className="text-lg font-extrabold text-gray-900 mb-2">Curated Experience</h4>
                    <p className="text-gray-500 leading-relaxed">Every artwork is hand-uploaded by verified creators</p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100">
                    <Shield size={20} className="text-gray-900" />
                  </div>
                  <div className="pt-1">
                    <h4 className="text-lg font-extrabold text-gray-900 mb-2">Secure & Direct</h4>
                    <p className="text-gray-500 leading-relaxed">Chat directly with creators — no intermediaries</p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 border border-gray-100">
                    <Zap size={20} className="text-gray-900" />
                  </div>
                  <div className="pt-1">
                    <h4 className="text-lg font-extrabold text-gray-900 mb-2">Free to Start</h4>
                    <p className="text-gray-500 leading-relaxed">Creators get 3 free uploads and a 10-day trial</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-[40px] shadow-[0_20px_60px_rgb(0,0,0,0.06)] p-12 border border-gray-50">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-8 bg-gray-50 rounded-[28px] transition-transform duration-300 hover:scale-105">
                  <p className="text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">100+</p>
                  <p className="text-gray-500 font-medium">Artworks</p>
                </div>
                <div className="text-center p-8 bg-rose-50 rounded-[28px] transition-transform duration-300 hover:scale-105">
                  <p className="text-4xl font-extrabold text-accent-coral mb-1 tracking-tight">50+</p>
                  <p className="text-gray-500 font-medium">Artists</p>
                </div>
                <div className="text-center p-8 bg-blue-50 rounded-[28px] transition-transform duration-300 hover:scale-105">
                  <p className="text-4xl font-extrabold text-blue-600 mb-1 tracking-tight">10+</p>
                  <p className="text-gray-500 font-medium">Categories</p>
                </div>
                <div className="text-center p-8 bg-emerald-50 rounded-[28px] transition-transform duration-300 hover:scale-105">
                  <p className="text-4xl font-extrabold text-emerald-600 mb-1 tracking-tight">24h</p>
                  <p className="text-gray-500 font-medium">Response</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">Ready to Start?</h2>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Whether you&apos;re a creator looking to showcase your work or a collector
            seeking your next masterpiece — Eras Studio is your platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-10 py-5 bg-white text-gray-900 rounded-full text-lg font-bold hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Account
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/discovery"
              className="inline-flex items-center gap-2 px-10 py-5 border border-white/20 text-white rounded-full text-lg font-bold hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Explore Gallery
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
