import { Heart, Eye, Users, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-5">About Eras Studio</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            We believe every artwork deserves to find its collector, and every
            creator deserves a platform that respects their craft.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-orange-50 to-rose-50 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-5 shadow-sm">
                <Target size={22} className="text-accent-coral" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To democratize the art market by creating a direct, transparent
                connection between creators and collectors — eliminating
                traditional barriers and gallery markups.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-5 shadow-sm">
                <Eye size={22} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                A world where art is accessible, artists are empowered, and
                every piece of creative work can find the eyes and hearts
                that will cherish it most.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 text-center mb-12">Our Values</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 text-center shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Heart size={20} className="text-red-500" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Passion First</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                We&apos;re built by art lovers, for art lovers. Every decision
                we make starts with the question: does this serve the art?
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <Users size={20} className="text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Community</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Eras Studio is more than a marketplace — it&apos;s a community of
                creators and collectors who share a love for art.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 text-center shadow-[0_2px_20px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <Eye size={20} className="text-emerald-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Transparency</h4>
              <p className="text-gray-500 text-sm leading-relaxed">
                Direct communication, fair pricing, no hidden fees.
                What you see is what you get.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
