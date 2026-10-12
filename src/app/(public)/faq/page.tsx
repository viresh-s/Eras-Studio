'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is Eras Studio?',
        a: 'Eras Studio is an online art marketplace that connects creators (painters, artists, and makers) with collectors. Artists can upload and manage their artworks, while collectors can browse, discover, and express interest in pieces they love.',
      },
      {
        q: 'Is Eras Studio free to use?',
        a: 'Yes! Collectors can browse and interact with creators completely free. Creators get a free tier with 3 artwork uploads. After that, creators can upgrade to Premium for unlimited uploads and additional features.',
      },
      {
        q: 'How does the buying process work?',
        a: 'When you find an artwork you\'re interested in, click "Express Interest" to start a direct conversation with the creator. You can discuss pricing, shipping, and other details directly — Eras Studio facilitates the connection, not the transaction.',
      },
    ],
  },
  {
    category: 'For Creators',
    questions: [
      {
        q: 'How do I start selling on Eras Studio?',
        a: 'Sign up as a Creator, complete your profile, and start uploading your artworks. You\'ll need to provide details like title, art type, description, and images for each piece.',
      },
      {
        q: 'What happens when my free trial ends?',
        a: 'After your 3 free uploads, you\'ll need to upgrade to Premium to continue uploading new artworks. Your existing artworks will always remain visible.',
      },
      {
        q: 'What types of art can I sell?',
        a: 'Eras Studio supports paintings, sculptures, photography, digital art, drawings, prints, mixed media, collages, textile art, ceramics, and more.',
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
      className={`bg-white rounded-xl border transition-all cursor-pointer ${
        isOpen ? 'border-gray-200 shadow-[0_4px_24px_rgb(0,0,0,0.06)]' : 'border-gray-100 hover:border-gray-200'
      }`}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex items-center justify-between p-5">
        <h4 className="font-semibold text-gray-900 text-sm pr-4">{q}</h4>
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
          {isOpen ? <ChevronUp size={14} className="text-gray-600" /> : <ChevronDown size={14} className="text-gray-600" />}
        </div>
      </div>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div>
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-5">FAQ</h1>
          <p className="text-xl text-gray-500">
            Frequently asked questions about Eras Studio
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-6 space-y-10">
          {faqs.map((section) => (
            <div key={section.category}>
              <span className="inline-flex items-center px-4 py-1.5 bg-gray-100 rounded-full text-xs font-semibold text-gray-700 mb-4">
                {section.category}
              </span>
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
