'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Minus } from 'lucide-react';

interface FaqItemData {
  id: string;
  q: string;
  a: string;
}

const FAQ_ITEMS: FaqItemData[] = [
  {
    id: '01',
    q: 'What is Eras Studio, and how does it work?',
    a: 'Eras Studio is a curated art marketplace that connects independent artists with art collectors. It provides creators with a space to showcase their work and enables collectors to discover, explore and acquire original artwork while building meaningful connections with artists.',
  },
  {
    id: '02',
    q: 'How can I become a verified creator on Eras Studio?',
    a: 'Artists can apply through the creator registration process by submitting their profile, artistic background and portfolio. Applications are reviewed by the Eras Studio team to ensure the platform maintains its standards of originality and artistic quality.',
  },
  {
    id: '03',
    q: 'How does Eras Studio ensure the authenticity and originality of artwork?',
    a: 'Eras Studio encourages creators to provide accurate artwork descriptions, authorship details and supporting documentation, including certificates of authenticity and provenance where applicable. Collectors are encouraged to review these details before acquiring an artwork.',
  },
  {
    id: '04',
    q: 'Who owns the copyright and intellectual property of uploaded artwork?',
    a: 'Artists retain ownership of their original artwork and intellectual property unless otherwise agreed through a separate written agreement. Displaying artwork on Eras Studio does not automatically transfer copyright or ownership to the platform.',
  },
  {
    id: '05',
    q: 'How can I acquire an artwork, and can I communicate directly with the artist?',
    a: 'Collectors can explore available artworks, review their details and initiate an acquisition enquiry. Eras Studio encourages direct communication between artists and collectors, allowing them to discuss pricing, availability, artwork details and acquisition arrangements.',
  },
  {
    id: '06',
    q: 'What happens after I purchase an artwork? How are payment and delivery handled?',
    a: 'Once an acquisition is agreed upon, the payment, packaging and delivery arrangements are confirmed according to the applicable transaction process. Collectors should verify the final price, shipping costs and expected delivery timeline before completing their purchase.',
  },
  {
    id: '07',
    q: 'What happens if an artwork arrives damaged, or I need to request a return?',
    a: 'If an artwork arrives damaged, document the condition with photographs and contact the designated support team promptly. Return, exchange and refund requests are assessed according to the applicable platform policies and transaction terms.',
  },
  {
    id: '08',
    q: 'How does Eras Studio protect my personal information and private communications?',
    a: "Eras Studio is committed to respecting user privacy and protecting personal information. Information is handled according to the platform's Privacy Policy, which outlines data collection, usage, storage and applicable user rights.",
  },
];

export default function FaqPage() {
  // Item 01 is open by default to match the editorial reference
  const [openId, setOpenId] = useState<string | null>('01');

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white min-h-[calc(100vh-140px)]">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 pt-12 sm:pt-16 pb-20">
        {/* Breadcrumb / Tag */}
        <div className="mb-3">
          <span className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.2em] text-[#8A8A85]">
            ERAS STUDIO / SUPPORT
          </span>
        </div>

        {/* Editorial Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif italic text-[#141413] tracking-tight leading-[1.1] mb-3">
          Questions, answered.
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-[#6E6E69] font-normal mb-10 sm:mb-12 max-w-2xl">
          A little more about the art, the artists and everything in between.
        </p>

        {/* FAQ Accordion List */}
        <div className="border-t border-[#EAEAE5]">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="border-b border-[#EAEAE5] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full py-5 sm:py-6 flex items-start sm:items-center justify-between gap-4 text-left group cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-baseline gap-4 sm:gap-8 flex-1 min-w-0">
                    <span className="text-xs sm:text-sm font-mono text-[#8A8A85] select-none shrink-0 w-6">
                      {item.id}
                    </span>
                    <h3 className="text-sm sm:text-base font-medium text-[#141413] group-hover:text-black transition-colors leading-snug">
                      {item.q}
                    </h3>
                  </div>
                  <span className="shrink-0 text-[#6E6E69] group-hover:text-[#141413] transition-colors ml-2 mt-0.5 sm:mt-0">
                    {isOpen ? (
                      <Minus size={16} strokeWidth={1.5} />
                    ) : (
                      <Plus size={16} strokeWidth={1.5} />
                    )}
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-6 pl-10 sm:pl-14 pr-4 sm:pr-12 animate-in fade-in-50 duration-200">
                    <p className="text-xs sm:text-sm text-[#6E6E69] leading-relaxed max-w-3xl">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Something else on your mind? Section */}
        <section className="mt-20 sm:mt-28">
          <h2 className="text-2xl sm:text-3xl font-medium text-[#141413] tracking-tight">
            Something else on your mind?
          </h2>
          <p className="text-sm sm:text-base text-[#6E6E69] mt-2 mb-4 font-normal">
            We&apos;re always happy to help.
          </p>
          <div>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1 text-sm sm:text-base font-medium text-[#141413] underline underline-offset-4 hover:opacity-75 transition-opacity"
            >
              Get in touch with Eras Studio
              <span className="text-sm leading-none select-none">↗</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
