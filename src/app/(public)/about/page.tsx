import Card from '@/components/ui/Card';
import { Heart, Eye, Users, Target } from 'lucide-react';

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b-4 border-brand-black bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="font-heading text-5xl font-bold mb-4">About ERAS</h1>
          <p className="text-xl text-brand-gray max-w-2xl mx-auto leading-relaxed">
            We believe every artwork deserves to find its collector, and every
            creator deserves a platform that respects their craft.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 border-b-4 border-brand-black">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-brand-yellow">
              <div className="p-2 border-3 border-brand-black bg-white inline-flex mb-4">
                <Target size={28} />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-3">Our Mission</h3>
              <p className="leading-relaxed">
                To democratize the art market by creating a direct, transparent
                connection between creators and collectors — eliminating
                traditional barriers and gallery markups.
              </p>
            </Card>

            <Card className="bg-brand-pink">
              <div className="p-2 border-3 border-brand-black bg-white inline-flex mb-4">
                <Eye size={28} />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-3">Our Vision</h3>
              <p className="leading-relaxed">
                A world where art is accessible, artists are empowered, and
                every piece of creative work can find the eyes and hearts
                that will cherish it most.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-white border-b-4 border-brand-black">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-heading text-3xl font-bold text-center mb-10">Our Values</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <Heart size={32} className="mx-auto mb-3 text-brand-red" />
              <h4 className="font-heading font-bold text-lg mb-2">Passion First</h4>
              <p className="text-brand-gray text-sm">
                We&apos;re built by art lovers, for art lovers. Every decision
                we make starts with the question: does this serve the art?
              </p>
            </Card>

            <Card className="text-center">
              <Users size={32} className="mx-auto mb-3 text-brand-blue" />
              <h4 className="font-heading font-bold text-lg mb-2">Community</h4>
              <p className="text-brand-gray text-sm">
                ERAS is more than a marketplace — it&apos;s a community of
                creators and collectors who share a love for art.
              </p>
            </Card>

            <Card className="text-center">
              <Eye size={32} className="mx-auto mb-3 text-brand-green" />
              <h4 className="font-heading font-bold text-lg mb-2">Transparency</h4>
              <p className="text-brand-gray text-sm">
                Direct communication, fair pricing, no hidden fees.
                What you see is what you get.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
