import Link from 'next/link';
import { ArrowRight, Palette, Sparkles, MessageCircle, ShieldCheck, Compass } from 'lucide-react';
import Marquee from 'react-fast-marquee';
import LandingHeroVisual from '@/components/features/public/LandingHeroVisual';
import { createClient } from '@/lib/supabase/server';
import { PROTECTED_CONTAINER_CLASS, PROTECTED_IMAGE_CLASS } from '@/lib/media/assetProtection';

interface ArtworkItem {
  id: string;
  title: string;
  art_type: string;
  artist_name: string;
  image_url: string;
  price: number | null;
  price_visibility?: string | null;
  status: string;
  year?: string | null;
  profiles?: { full_name: string } | null;
}

const fallbackArtworks: ArtworkItem[] = [
  {
    id: 'sample-1',
    title: 'Blue Horizon in Ultramarine',
    art_type: 'Painting',
    artist_name: 'Julian Moreau',
    image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=700&q=80',
    price: 185000,
    status: 'Available',
    year: '2024'
  },
  {
    id: 'sample-2',
    title: 'Monsoon Study No. 4',
    art_type: 'Painting',
    artist_name: 'Aria Chen',
    image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=80',
    price: 145000,
    status: 'Available',
    year: '2024'
  },
  {
    id: 'sample-3',
    title: 'Fragments of Memory',
    art_type: 'Mixed Media',
    artist_name: 'Marcus Vance',
    image_url: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&w=700&q=80',
    price: 220000,
    status: 'Available',
    year: '2023'
  },
  {
    id: 'sample-4',
    title: 'Elysian Echoes',
    art_type: 'Photography',
    artist_name: 'Elena Rostova',
    image_url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=700&q=80',
    price: null,
    status: 'Available',
    year: '2024'
  }
];

export default async function HomePage() {
  const supabase = await createClient();
  
  // Fetch recent available artworks from database
  const { data: dbArtworks } = await supabase
    .from('artworks')
    .select('id, title, art_type, artist_name, image_url, price, price_visibility, status, year, profiles(full_name)')
    .eq('status', 'Available')
    .order('created_at', { ascending: false })
    .limit(4);

  const displayArtworks = (dbArtworks && dbArtworks.length >= 4)
    ? (dbArtworks as unknown as ArtworkItem[])
    : (dbArtworks && dbArtworks.length > 0)
      ? [...(dbArtworks as unknown as ArtworkItem[]), ...fallbackArtworks.slice(dbArtworks.length)]
      : fallbackArtworks;

  return (
    <div className="bg-[#FAF5EC] text-[#141413]">
      
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start z-10">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/80 rounded-full text-xs font-semibold tracking-[0.2em] text-[#6E6E69] uppercase border border-[#E8E8E3] mb-8 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#865E16] block" />
                A SPACE FOR THE CREATIVE SPIRIT
              </div>

              <h1 className="text-5xl sm:text-7xl lg:text-[84px] font-bold text-[#141413] tracking-tight leading-[1.04] mb-8 font-serif">
                Where art meets<br />
                its <span className="italic font-normal">true collector.</span>
              </h1>

              <p className="text-lg md:text-xl text-[#6E6E69] leading-relaxed mb-10 max-w-xl font-normal">
                Eras Studio connects visionary independent artists with discerning patrons.
                Discover original perspectives, acquire directly from creators, and build a collection of authentic significance.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/discovery"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#141413] text-white border border-[#141413] rounded-full text-xs uppercase tracking-[0.08em] font-medium hover:bg-black transition-all duration-200 group"
                >
                  <span>Explore the Gallery</span>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-transparent text-[#141413] border border-[#141413]/25 rounded-full text-xs uppercase tracking-[0.08em] font-medium hover:border-[#141413] hover:bg-[#141413] hover:text-white transition-all duration-200"
                >
                  <span>Join as Creator</span>
                </Link>
              </div>
            </div>

            {/* Right Artwork Composition */}
            <div className="lg:col-span-5 w-full">
              <LandingHeroVisual />
            </div>

          </div>
        </div>
      </section>

      {/* 2. Curated Discipline Ribbon */}
      <section className="bg-[#141413] text-white py-4 border-y border-[#262624]">
        <Marquee speed={36} gradient={false} autoFill>
          <div className="flex items-center gap-10 font-serif text-xs tracking-[0.25em] uppercase px-4 select-none">
            <span className="text-white">Original Oil & Acrylic</span>
            <span className="text-[#865E16] text-sm">◆</span>
            <span className="text-[#9E9E98]">Contemporary Sculpture</span>
            <span className="text-[#865E16] text-sm">◆</span>
            <span className="text-white">Fine Art Photography</span>
            <span className="text-[#865E16] text-sm">◆</span>
            <span className="text-[#9E9E98]">Mixed Media & Collage</span>
            <span className="text-[#865E16] text-sm">◆</span>
            <span className="text-white">Direct Studio Acquisition</span>
            <span className="text-[#865E16] text-sm">◆</span>
            <span className="text-[#9E9E98]">Certified Provenance</span>
            <span className="text-[#865E16] text-sm">◆</span>
            <span className="text-white">Zero Middlemen</span>
            <span className="text-[#865E16] text-sm">◆</span>
          </div>
        </Marquee>
      </section>

      {/* 3. Featured Artworks Showcase */}
      <section className="py-24 md:py-32">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#6E6E69] uppercase mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
                CURATED SELECTIONS
              </p>
              <h2 className="text-3xl md:text-5xl font-bold font-serif tracking-tight text-[#141413]">
                Recent works from the studio
              </h2>
            </div>
            <Link
              href="/discovery"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] font-medium text-[#141413] hover:text-[#865E16] transition-colors group pb-0.5 border-b border-[#141413]/25 hover:border-[#865E16]"
            >
              <span>Explore all works</span>
              <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayArtworks.map((artwork) => (
              <Link
                key={artwork.id}
                href={`/artwork/${artwork.id}`}
                className="group block cursor-pointer"
              >
                <div className="flex flex-col h-full">
                  <div className={`aspect-[4/5] bg-[#E8E8E3] overflow-hidden relative rounded-2xl mb-4 border border-[#E8E8E3] ${PROTECTED_CONTAINER_CLASS}`}>
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      draggable={false}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out select-none pointer-events-none ${PROTECTED_IMAGE_CLASS}`}
                    />
                    {/* Transparent overlay shield */}
                    <div
                      className="absolute inset-0 z-[2]"
                      aria-hidden="true"
                    />
                    <div className="absolute top-3.5 right-3.5 z-10">
                      <span className="inline-block px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-full bg-white/95 backdrop-blur-md text-[#141413] shadow-sm">
                        {artwork.art_type}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col px-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3
                          className="font-serif italic text-[18px] font-semibold text-[#141413] truncate leading-tight group-hover:opacity-75 transition-opacity"
                          style={{ fontFamily: "'Century Schoolbook', Century, serif", fontStyle: 'italic' }}
                        >
                          {artwork.title}
                        </h3>
                        <p className="font-sans text-[#6E6E69] text-[11px] mt-1.5 uppercase tracking-wider font-semibold" style={{ fontFamily: "'Poppins', sans-serif" }}>
                          {artwork.artist_name || artwork.profiles?.full_name}
                          {artwork.year ? `, ${artwork.year}` : ''}
                        </p>
                      </div>
                      <div className="shrink-0 text-right pt-0.5">
                        {artwork.price_visibility === 'Hide Price' || artwork.price_visibility === 'Hidden' ? null : artwork.price_visibility === 'Price on Request' ? (
                          <span className="text-[#6E6E69] text-[11px] font-medium uppercase tracking-wider">
                            On Request
                          </span>
                        ) : artwork.price ? (
                          <span className="font-bold text-[#141413] text-sm font-sans">
                            ₹{artwork.price.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-[#6E6E69] text-[11px] font-medium uppercase tracking-wider">
                            On Request
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. The Eras Standard (Pillars) */}
      <section className="py-24 md:py-32 bg-[#FAFAFA] border-y border-[#E8E8E3]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#6E6E69] uppercase mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#865E16]" />
              THE ERAS STANDARD
            </p>
            <h2 className="text-3xl md:text-5xl font-bold font-serif tracking-tight text-[#141413] mb-4">
              A gallery without walls, built for authentic craft.
            </h2>
            <p className="text-base md:text-lg text-[#6E6E69] leading-relaxed">
              We reimagined the relationship between artists and collectors—replacing opaque gallery politics with direct human dialogue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="bg-white rounded-3xl p-10 border border-[#E8E8E3] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-[#865E16] uppercase block mb-6">
                  01 / CREATOR AUTONOMY
                </span>
                <div className="w-12 h-12 rounded-2xl bg-[#F7F7F7] border border-[#E8E8E3] flex items-center justify-center mb-6">
                  <Palette size={22} className="text-[#141413]" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#141413] mb-3">
                  Sovereign Exhibition
                </h3>
                <p className="text-[#6E6E69] text-sm leading-relaxed">
                  Artists retain total creative independence, curate their personal portfolio, and set their own acquisition terms without traditional commission gouging.
                </p>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-3xl p-10 border border-[#E8E8E3] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-[#865E16] uppercase block mb-6">
                  02 / CERTIFIED PROVENANCE
                </span>
                <div className="w-12 h-12 rounded-2xl bg-[#F7F7F7] border border-[#E8E8E3] flex items-center justify-center mb-6">
                  <ShieldCheck size={22} className="text-[#141413]" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#141413] mb-3">
                  Direct Acquisition
                </h3>
                <p className="text-[#6E6E69] text-sm leading-relaxed">
                  Every work is published directly from the verified artist’s studio. Patrons receive uncompromised authenticity, provenance, and narrative depth.
                </p>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-3xl p-10 border border-[#E8E8E3] shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold tracking-widest text-[#865E16] uppercase block mb-6">
                  03 / INTIMATE DIALOGUE
                </span>
                <div className="w-12 h-12 rounded-2xl bg-[#F7F7F7] border border-[#E8E8E3] flex items-center justify-center mb-6">
                  <MessageCircle size={22} className="text-[#141413]" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#141413] mb-3">
                  Private Studio Chat
                </h3>
                <p className="text-[#6E6E69] text-sm leading-relaxed">
                  Direct one-on-one correspondence between creator and collector. Inquire about inspiration, discuss bespoke framing, or commission personalized creations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Curatorial Pull-Quote */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-10 h-10 rounded-full bg-[#F5F5F5] flex items-center justify-center mx-auto mb-8 text-[#865E16]">
            <Compass size={20} />
          </div>
          <blockquote className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal italic text-[#141413] leading-snug mb-8">
            &ldquo;Art is not a passive decorative commodity—it is an authentic human dialogue waiting to be discovered.&rdquo;
          </blockquote>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6E6E69]">
            The Eras Studio Curatorial Direction
          </p>
        </div>
      </section>

      {/* 6. The Exhibition Metrics */}
      <section className="py-20 bg-white border-y border-[#E8E8E3]">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-[#E8E8E3]">
            <div className="pt-6 md:pt-0">
              <p className="font-serif text-4xl md:text-5xl font-bold text-[#141413] mb-2">100+</p>
              <p className="text-xs uppercase tracking-widest text-[#6E6E69] font-medium">Curated Works</p>
            </div>
            <div className="pt-6 md:pt-0">
              <p className="font-serif text-4xl md:text-5xl font-bold text-[#141413] mb-2">50+</p>
              <p className="text-xs uppercase tracking-widest text-[#6E6E69] font-medium">Verified Artists</p>
            </div>
            <div className="pt-6 md:pt-0">
              <p className="font-serif text-4xl md:text-5xl font-bold text-[#141413] mb-2">12+</p>
              <p className="text-xs uppercase tracking-widest text-[#6E6E69] font-medium">Art Disciplines</p>
            </div>
            <div className="pt-6 md:pt-0">
              <p className="font-serif text-4xl md:text-5xl font-bold text-[#141413] mb-2">100%</p>
              <p className="text-xs uppercase tracking-widest text-[#6E6E69] font-medium">Direct Connection</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Grand Exhibition Salon CTA */}
      <section className="py-24 md:py-32">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="bg-[#141413] text-white rounded-[36px] md:rounded-[44px] p-12 md:p-24 relative overflow-hidden shadow-2xl">
            
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#865E16] opacity-10 blur-3xl pointer-events-none rounded-full" />

            <div className="max-w-2xl mx-auto text-center relative z-10">
              <p className="text-xs font-semibold tracking-[0.25em] text-[#865E16] uppercase mb-6 flex items-center justify-center gap-2">
                <Sparkles size={14} />
                THE CONTEMPORARY SALON
              </p>

              <h2 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight mb-6 leading-tight">
                Begin your collection.<br />
                <span className="italic font-normal text-white/80">Or share your craft.</span>
              </h2>

              <p className="text-base md:text-lg text-[#9E9E98] leading-relaxed mb-10 max-w-xl mx-auto">
                Whether you seek a singular masterpiece to transform your sanctuary, or an artist seeking visionary patrons—Eras Studio is your platform.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-[#141413] border border-white rounded-full text-xs uppercase tracking-[0.08em] font-medium hover:bg-white/90 transition-all duration-200 group"
                >
                  <span>Create Your Account</span>
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>
                <Link
                  href="/discovery"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-transparent text-white border border-white/30 rounded-full text-xs uppercase tracking-[0.08em] font-medium hover:border-white hover:bg-white hover:text-[#141413] transition-all duration-200"
                >
                  <span>Browse the Gallery</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
