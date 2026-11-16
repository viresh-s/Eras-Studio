'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  Plus,
  Minus,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FaqItemData {
  id: string;
  category: 'general' | 'creators' | 'collectors' | 'trust';
  categoryLabel: string;
  q: string;
  a: string;
}

const CATEGORIES = [
  { id: 'all', label: 'All Questions' },
  { id: 'general', label: 'General' },
  { id: 'creators', label: 'For Creators' },
  { id: 'collectors', label: 'For Collectors' },
  { id: 'trust', label: 'Trust & Safety' },
] as const;

const FAQ_ITEMS: FaqItemData[] = [
  {
    id: '01',
    category: 'general',
    categoryLabel: 'General',
    q: 'What is Eras Studio, and how does it work?',
    a: 'Eras Studio is a curated art marketplace that connects independent artists with art collectors. It provides creators with a dedicated space to showcase and monetize their work while enabling collectors to discover, explore, and acquire original artwork directly through meaningful creator-collector dialogue.',
  },
  {
    id: '02',
    category: 'creators',
    categoryLabel: 'For Creators',
    q: 'How can I become a verified creator on Eras Studio?',
    a: 'Artists can apply through the creator registration process by submitting their profile, artistic background, and portfolio. Applications are curated by the Eras Studio curatorial board to ensure the platform maintains exceptional standards of originality, craft, and artistic quality.',
  },
  {
    id: '03',
    category: 'trust',
    categoryLabel: 'Trust & Safety',
    q: 'How does Eras Studio ensure the authenticity and originality of artwork?',
    a: 'Eras Studio requires creators to provide accurate artwork descriptions, dimensions, medium details, and provenance documentation, including Certificates of Authenticity where applicable. High-resolution multi-angle photography and anti-download protection protect artist assets and allow collectors to inspect details thoroughly before acquisition.',
  },
  {
    id: '04',
    category: 'creators',
    categoryLabel: 'For Creators',
    q: 'Who owns the copyright and intellectual property of uploaded artwork?',
    a: 'Artists retain 100% ownership of their original artwork and all underlying intellectual property rights. Displaying and exhibiting artwork on Eras Studio does not transfer copyright or ownership to the platform or any third party.',
  },
  {
    id: '05',
    category: 'collectors',
    categoryLabel: 'For Collectors',
    q: 'How can I acquire an artwork, and can I communicate directly with the artist?',
    a: 'Collectors can explore available artworks on the Discovery page and initiate a direct enquiry or private chat with the creator. Eras Studio fosters direct, transparent communication between collectors and artists to discuss pricing, framing, bespoke commissions, and acquisition arrangements.',
  },
  {
    id: '06',
    category: 'collectors',
    categoryLabel: 'For Collectors',
    q: 'What happens after I purchase an artwork? How are payment and delivery handled?',
    a: 'Once an acquisition is confirmed between buyer and artist, payment and secure transit are scheduled. Artworks are packaged using museum-grade archival wrapping and tracked delivery. Collectors receive tracking updates and acquisition receipts directly in their account.',
  },
  {
    id: '07',
    category: 'collectors',
    categoryLabel: 'For Collectors',
    q: 'What happens if an artwork arrives damaged, or I need to request a return?',
    a: 'In the rare event an artwork arrives damaged in transit, simply document the condition with clear photographs and contact our support team within 48 hours. Our team assists with transit insurance claims, professional restoration, or eligible refunds in accordance with our collector protection standards.',
  },
  {
    id: '08',
    category: 'trust',
    categoryLabel: 'Trust & Safety',
    q: 'How does Eras Studio protect my personal information and private communications?',
    a: 'All private collector-creator conversations, transactions, and user dossier information are encrypted in transit and at rest. We adhere to rigorous privacy standards, and user data is never sold or shared with unapproved third parties.',
  },
];

export default function FaqPage() {
  const [openId, setOpenId] = useState<string | null>('01');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  // Filter items by category & search query
  const filteredItems = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      const qText = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !qText ||
        item.q.toLowerCase().includes(qText) ||
        item.a.toLowerCase().includes(qText) ||
        item.categoryLabel.toLowerCase().includes(qText);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#141413] font-sans selection:bg-[#141413] selection:text-white">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Editorial ERAS Style)                                     */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-14 sm:pt-20 sm:pb-20 border-b border-[#E8E8E3] bg-[#FAF9F5]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          {/* Subtle Pill Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E8E8E3] bg-white text-xs text-[#6E6E69] mb-5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1345EE]" />
            <span>Eras Studio Support</span>
            <span className="text-[#8A8A85]">·</span>
            <span className="text-[#1345EE] font-medium">FAQ & Help Center</span>
          </div>

          {/* Editorial Title */}
          <h1 className="font-serif italic font-medium text-4xl sm:text-5xl md:text-6xl tracking-tight text-[#141413] mb-4 leading-[1.12]">
            Questions, answered.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#6E6E69] max-w-xl mx-auto leading-relaxed">
            Everything you need to know about collecting, exhibiting, acquiring, and connecting on Eras Studio.
          </p>

          {/* Interactive Search Bar Pill */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="search-gradient-border-pill p-1.5 sm:p-2 bg-white shadow-[0_2px_14px_rgba(0,0,0,0.04)] flex items-center gap-3">
              <div className="pl-3.5 text-gray-400 flex items-center shrink-0">
                <Search size={18} className="stroke-[1.75]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions, topics, or keywords..."
                className="flex-1 bg-transparent text-sm text-[#141413] placeholder:text-gray-400 outline-none min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. MAIN FAQ CONTENT AREA                                                  */}
      {/* ========================================================================= */}
      <section className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-10 scrollbar-none justify-start sm:justify-center">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count =
              cat.id === 'all'
                ? FAQ_ITEMS.length
                : FAQ_ITEMS.filter((i) => i.category === cat.id).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-medium cursor-pointer transition-all duration-150 flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#141413] text-white shadow-xs font-semibold'
                    : 'text-gray-600 bg-white border border-[#E8E8E3] hover:border-[#141413]/30 hover:text-[#141413]'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion Cards List */}
        {filteredItems.length > 0 ? (
          <div className="space-y-3.5">
            {filteredItems.map((item) => {
              const isOpen = openId === item.id;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl sm:rounded-3xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'border-[#141413]/30 shadow-[0_6px_20px_rgba(20,20,19,0.05)]'
                      : 'border-[#E8E8E3] hover:border-[#D1D1CB] shadow-[0_2px_8px_rgba(20,20,19,0.02)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-5 sm:p-6 flex items-start sm:items-center justify-between gap-4 text-left group cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* Monospace Item Counter */}
                      <span className="text-xs font-mono text-[#8A8A85] shrink-0 pt-0.5 sm:pt-0">
                        {item.id}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-[#FAF9F5] border border-[#E8E8E3] text-[#6E6E69]">
                            {item.categoryLabel}
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-base font-medium text-[#141413] group-hover:text-[#1345EE] transition-colors leading-snug">
                          {item.q}
                        </h3>
                      </div>
                    </div>

                    {/* Expand/Collapse Circle Icon */}
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center shrink-0 transition-all ml-1 mt-0.5 sm:mt-0 ${
                        isOpen
                          ? 'bg-[#141413] text-white border-[#141413]'
                          : 'bg-[#FAF9F5] text-[#6E6E69] border-[#E8E8E3] group-hover:border-[#141413]/40 group-hover:text-[#141413]'
                      }`}
                    >
                      {isOpen ? (
                        <Minus size={14} strokeWidth={2} />
                      ) : (
                        <Plus size={14} strokeWidth={2} />
                      )}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                      >
                        <div className="px-5 pb-6 pt-0 sm:px-6 sm:pb-6">
                          <div className="pl-7 sm:pl-9 pt-3 border-t border-[#F0F0EB]">
                            <p className="text-xs sm:text-sm text-[#555550] leading-relaxed">
                              {item.a}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State when Search Query has no matches */
          <div className="bg-[#FAF9F5] border border-[#E8E8E3] rounded-3xl p-10 sm:p-14 text-center">
            <div className="w-12 h-12 rounded-full bg-white border border-[#E8E8E3] flex items-center justify-center mx-auto mb-4 text-[#8A8A85]">
              <HelpCircle size={22} />
            </div>
            <h3 className="font-serif italic text-xl font-medium text-[#141413] mb-2">
              No matching questions found
            </h3>
            <p className="text-sm text-[#6E6E69] max-w-sm mx-auto mb-6">
              We couldn&apos;t find an answer matching &ldquo;{searchQuery}&rdquo;. Try another term or contact our support team.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-5 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-full hover:bg-black transition-colors cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. CALL TO ACTION                                                         */}
        {/* ========================================================================= */}
        <div className="mt-16 sm:mt-24 bg-[#FAF9F5] border border-[#E8E8E3] rounded-3xl p-8 sm:p-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-serif italic text-[#141413] tracking-tight mb-2.5">
            Still have questions?
          </h2>
          <p className="text-xs sm:text-sm text-[#6E6E69] max-w-md mx-auto mb-8 font-normal leading-relaxed">
            We&apos;re here to help. Reach out to our team and we will get back to you shortly.
          </p>
          <div className="text-center">
            <Link
              href="/contact"
              className="btn-premium-gradient-pill px-8 py-3.5 text-xs uppercase tracking-[0.08em] font-medium gap-2 cursor-pointer shadow-md group"
            >
              <span>Get in Touch</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
