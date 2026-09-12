'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is ERAS?',
        a: 'ERAS is an online art marketplace that connects creators (painters, artists, and makers) with collectors. Artists can upload and manage their artworks, while collectors can browse, discover, and express interest in pieces they love.',
      },
      {
        q: 'Is ERAS free to use?',
        a: 'Yes! Collectors can browse and interact with creators completely free. Creators get a free trial with 3 artwork uploads and a 10-day access period. After that, creators can upgrade to Premium for unlimited uploads and additional features.',
      },
      {
        q: 'How does the buying process work?',
        a: 'When you find an artwork you\'re interested in, click "Express Interest" to start a direct conversation with the creator. You can discuss pricing, shipping, and other details directly — ERAS facilitates the connection, not the transaction.',
      },
    ],
  },
  {
    category: 'For Creators',
    questions: [
      {
        q: 'How do I start selling on ERAS?',
        a: 'Sign up as a Creator, complete your profile, and start uploading your artworks. You\'ll need to provide details like title, art type, description, and images for each piece.',
      },
      {
        q: 'What happens when my free trial ends?',
        a: 'After your 10-day trial or 3 free uploads (whichever comes first), you\'ll need to upgrade to Premium to continue uploading new artworks. Your existing artworks will remain visible.',
      },
      {
        q: 'What types of art can I sell?',
        a: 'ERAS supports paintings, sculptures, photography, digital art, drawings, prints, mixed media, collages, textile art, ceramics, and more.',
      },
    ],
  },
  {
    category: 'For Collectors',
    questions: [
      {
        q: 'How do I find artworks I\'m interested in?',
        a: 'Use the Browse page to explore available artworks. You can search by artist name or filter by art type to find pieces that match your taste.',
      },
      {
        q: 'Is my conversation with creators private?',
        a: 'Yes, all conversations are 1-1 between you and the creator. Only the two participants can see the messages exchanged.',
      },
      {
        q: 'Can I save artworks for later?',
        a: 'This feature is coming soon! For now, you can bookmark the artwork page or start a conversation with the creator to keep track of pieces you\'re interested in.',
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`border-3 border-brand-black transition-all cursor-pointer ${
        isOpen ? 'bg-white shadow-brutal' : 'bg-white hover:bg-brand-lightgray'
      }`}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex items-center justify-between p-4">
        <h4 className="font-heading font-bold text-base pr-4">{q}</h4>
        <div className="flex-shrink-0 p-1 border-2 border-brand-black">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
      {isOpen && (
        <div className="px-4 pb-4 border-t-2 border-brand-black pt-3">
          <p className="text-brand-gray leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div>
      <section className="border-b-4 border-brand-black bg-white">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="font-heading text-5xl font-bold mb-4">FAQ</h1>
          <p className="text-xl text-brand-gray">
            Frequently asked questions about ERAS
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6 space-y-10">
          {faqs.map((section) => (
            <div key={section.category}>
              <div className="inline-block mb-4 px-4 py-2 border-3 border-brand-black bg-brand-yellow font-heading font-bold text-sm uppercase tracking-widest">
                {section.category}
              </div>
              <div className="space-y-3">
                {section.questions.map((faq) => (
                  <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
