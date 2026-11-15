'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Plus, Minus, X, ArrowUpRight, MessageSquare, Mail, Compass } from 'lucide-react';

interface FaqItemData {
  id: string;
  category: 'about' | 'creators' | 'purchasing' | 'privacy';
  q: string;
  a: string;
}

const FAQ_ITEMS: FaqItemData[] = [
  {
    id: '01',
    category: 'about',
    q: 'What is Eras Studio, and how does it work?',
    a: 'Eras Studio is a curated art marketplace that connects independent artists with art collectors. It provides creators with a space to showcase their work and enables collectors to discover, explore and acquire original artwork while building meaningful connections with artists.',
  },
  {
    id: '02',
    category: 'creators',
    q: 'How can I become a verified creator on Eras Studio?',
    a: 'Artists can apply through the creator registration process by submitting their profile, artistic background and portfolio. Applications are reviewed by the Eras Studio team to ensure the platform maintains its standards of originality and artistic quality.',
  },
  {
    id: '03',
    category: 'creators',
    q: 'How does Eras Studio ensure the authenticity and originality of artwork?',
    a: 'Eras Studio encourages creators to provide accurate artwork descriptions, authorship details and supporting documentation, including certificates of authenticity and provenance where applicable. Collectors are encouraged to review these details before acquiring an artwork.',
  },
  {
    id: '04',
    category: 'creators',
    q: 'Who owns the copyright and intellectual property of uploaded artwork?',
    a: 'Artists retain ownership of their original artwork and intellectual property unless otherwise agreed through a separate written agreement. Displaying artwork on Eras Studio does not automatically transfer copyright or ownership to the platform.',
  },
  {
    id: '05',
    category: 'purchasing',
    q: 'How can I acquire an artwork, and can I communicate directly with the artist?',
    a: 'Collectors can explore available artworks, review their details and initiate an acquisition enquiry. Eras Studio encourages direct communication between artists and collectors, allowing them to discuss pricing, availability, artwork details and acquisition arrangements.',
  },
  {
    id: '06',
    category: 'purchasing',
    q: 'What happens after I purchase an artwork? How are payment and delivery handled?',
    a: 'Once an acquisition is agreed upon, the payment, packaging and delivery arrangements are confirmed according to the applicable transaction process. Collectors should verify the final price, shipping costs and expected delivery timeline before completing their purchase.',
  },
  {
    id: '07',
    category: 'purchasing',
    q: 'What happens if an artwork arrives damaged, or I need to request a return?',
    a: 'If an artwork arrives damaged, document the condition with photographs and contact the designated support team promptly. Return, exchange and refund requests are assessed according to the applicable platform policies and transaction terms.',
  },
  {
    id: '08',
    category: 'privacy',
    q: 'How does Eras Studio protect my personal information and private communications?',
    a: "Eras Studio is committed to respecting user privacy and protecting personal information. Information is handled according to the platform's Privacy Policy, which outlines data collection, usage, storage and applicable user rights.",
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'about', label: 'About ERAS' },
  { id: 'creators', label: 'Creators & Artwork' },
  { id: 'purchasing', label: 'Purchasing & Delivery' },
  { id: 'privacy', label: 'Privacy & Security' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  // First item open by default for editorial composition
  const [openId, setOpenId] = useState<string | null>('01');

  // Filter questions based on category and live search query
  const filteredFaqs = useMemo(() => {
    let list = FAQ_ITEMS;

    if (selectedCategory !== 'all') {
      list = list.filter((item) => item.category === selectedCategory);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (item) =>
          item.q.toLowerCase().includes(query) ||
          item.a.toLowerCase().includes(query) ||
          item.id.includes(query)
      );
    }

    return list;
  }, [searchQuery, selectedCategory]);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <div className="bg-white min-h-[calc(100vh-140px)] text-[#141413]">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-12 sm:pt-16 pb-24">
        {/* ========================================================================= */}
        {/* SECTION 01 — FAQ INTRODUCTION & SEARCH                                    */}
        {/* ========================================================================= */}
        <section className="max-w-3xl mb-12 sm:mb-16">
          {/* Breadcrumb Context */}
          <div className="mb-4">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#8A8A85]">
              ERAS STUDIO / SUPPORT
            </span>
          </div>

          {/* Signature Editorial Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif italic text-[#141413] tracking-tight leading-[1.08] mb-4">
            Questions, answered.
          </h1>

          {/* Supporting Copy */}
          <p className="text-base sm:text-lg text-[#6E6E69] font-normal leading-relaxed mb-8">
            Everything you need to know about discovering art, supporting independent artists and using ERAS Studio.
          </p>

          {/* Search Input Box */}
          <div className="relative w-full max-w-xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8A85] pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search a question or topic..."
              aria-label="Search FAQ questions"
              className="w-full pl-11 pr-10 py-3 bg-white border border-[#E8E8E3] rounded-xl text-sm text-[#141413] placeholder-[#9E9E98] focus:outline-none focus:border-[#141413] focus:ring-1 focus:ring-[#141413] transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8A85] hover:text-[#141413] transition-colors p-1"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 02 — QUICK HELP CATEGORIES                                        */}
        {/* ========================================================================= */}
        <section className="mb-12 sm:mb-16">
          <div className="flex items-center gap-2 overflow-x-auto pb-3 select-none scrollbar-none border-b border-[#F0F0EB]">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id && !searchQuery.trim();
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (searchQuery) setSearchQuery('');
                  }}
                  className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#141413] text-white shadow-2xs'
                      : 'text-[#6E6E69] hover:text-[#141413] hover:bg-[#F2F0ED] border border-transparent hover:border-[#E8E8E3]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 03 — MAIN FAQ ACCORDION (Two-Column Editorial Composition)        */}
        {/* ========================================================================= */}
        <section className="mb-20 sm:mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            {/* Left Column: Contextual Overview & State Indicator */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1345EE]">
                  Editorial Guidance
                </span>
                <h2 className="admin-century-title text-2xl sm:text-3xl text-[#141413] tracking-tight leading-snug mt-2">
                  Common Inquiries.
                </h2>
                <p className="text-xs sm:text-sm text-[#6E6E69] leading-relaxed mt-2.5">
                  Clear, verified answers covering representation, authentic acquisitions, provenance records, and patron security.
                </p>
              </div>

              {/* Active Filter Pill / State Indicator */}
              {(selectedCategory !== 'all' || searchQuery.trim()) && (
                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FAF9F6] border border-[#E8E8E3] text-xs text-[#6E6E69]">
                    <span>
                      Showing {filteredFaqs.length} of {FAQ_ITEMS.length} entries
                    </span>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[#141413] hover:text-[#1345EE] underline underline-offset-2 ml-1 cursor-pointer font-medium"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Accordion Questions & Answers */}
            <div className="lg:col-span-8">
              <div className="border-t border-[#EAEAE5]">
                {filteredFaqs.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-sm text-[#6E6E69] mb-4">
                      No questions found matching your search.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-[0.08em] font-medium text-[#141413] border border-[#E8E8E3] rounded-full hover:bg-[#F2F0ED] transition-colors"
                    >
                      Show all questions
                    </button>
                  </div>
                ) : (
                  filteredFaqs.map((item) => {
                    const isOpen = openId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="border-b border-[#EAEAE5] transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(item.id)}
                          aria-expanded={isOpen}
                          aria-controls={`faq-answer-${item.id}`}
                          className="w-full py-5 sm:py-6 flex items-start justify-between gap-4 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#141413] rounded-sm"
                        >
                          <div className="flex items-baseline gap-4 sm:gap-6 flex-1 min-w-0">
                            <span className="text-xs sm:text-sm font-mono text-[#8A8A85] select-none shrink-0 w-6">
                              {item.id}
                            </span>
                            <h3 className="text-sm sm:text-base font-medium text-[#141413] group-hover:text-[#1345EE] transition-colors leading-snug">
                              {item.q}
                            </h3>
                          </div>
                          <span className="shrink-0 text-[#6E6E69] group-hover:text-[#141413] transition-colors ml-2 mt-0.5 sm:mt-0 p-1">
                            {isOpen ? (
                              <Minus size={16} strokeWidth={1.5} />
                            ) : (
                              <Plus size={16} strokeWidth={1.5} />
                            )}
                          </span>
                        </button>

                        {isOpen && (
                          <div
                            id={`faq-answer-${item.id}`}
                            className="pb-6 pl-10 sm:pl-12 pr-4 sm:pr-8 animate-in fade-in duration-200"
                          >
                            <p className="text-xs sm:text-sm text-[#6E6E69] leading-relaxed max-w-2xl">
                              {item.a}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 04 — STILL NEED HELP? (Direct Support & Inquiry Channels)         */}
        {/* ========================================================================= */}
        <section className="pt-12 sm:pt-16 border-t border-[#E8E8E3]">
          <div className="max-w-2xl mb-8">
            <h2 className="admin-century-title text-2xl sm:text-3xl font-medium text-[#141413] tracking-tight leading-tight">
              Still have a question?
            </h2>
            <p className="text-sm sm:text-base text-[#6E6E69] mt-2 font-normal leading-relaxed">
              Our team is here to help with anything you couldn&apos;t find in the FAQ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* General Inquiries */}
            <div className="p-6 rounded-2xl border border-[#E8E8E3] bg-white hover:border-[#141413]/40 transition-all shadow-2xs group flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#000000] border border-black flex items-center justify-center text-white mb-4 group-hover:bg-[#1345EE] transition-colors">
                  <MessageSquare size={16} className="stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-semibold text-[#141413]">
                  Studio Inquiries
                </h3>
                <p className="text-xs text-[#6E6E69] leading-relaxed mt-1.5">
                  Send our curatorial support team a direct message regarding your account, artworks, or verification.
                </p>
              </div>
              <div className="pt-5">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#141413] hover:text-[#1345EE] transition-colors"
                >
                  <span>Contact ERAS Studio</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* Direct Studio Email */}
            <div className="p-6 rounded-2xl border border-[#E8E8E3] bg-white hover:border-[#141413]/40 transition-all shadow-2xs group flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#000000] border border-black flex items-center justify-center text-white mb-4 group-hover:bg-[#1345EE] transition-colors">
                  <Mail size={16} className="stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-semibold text-[#141413]">
                  Direct Correspondence
                </h3>
                <p className="text-xs text-[#6E6E69] leading-relaxed mt-1.5">
                  For institutional opportunities, press communications, and curatorial partnership inquiries.
                </p>
              </div>
              <div className="pt-5">
                <a
                  href="mailto:hello@eras.art"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#141413] hover:text-[#1345EE] transition-colors"
                >
                  <span>hello@eras.art</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>

            {/* Artwork & Acquisition Support */}
            <div className="p-6 rounded-2xl border border-[#E8E8E3] bg-white hover:border-[#141413]/40 transition-all shadow-2xs group flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#000000] border border-black flex items-center justify-center text-white mb-4 group-hover:bg-[#1345EE] transition-colors">
                  <Compass size={16} className="stroke-[1.75]" />
                </div>
                <h3 className="text-sm font-semibold text-[#141413]">
                  Artwork Acquisitions
                </h3>
                <p className="text-xs text-[#6E6E69] leading-relaxed mt-1.5">
                  Explore original works across curated disciplines and initiate purchase arrangements directly.
                </p>
              </div>
              <div className="pt-5">
                <Link
                  href="/discovery"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#141413] hover:text-[#1345EE] transition-colors"
                >
                  <span>Browse Gallery</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
