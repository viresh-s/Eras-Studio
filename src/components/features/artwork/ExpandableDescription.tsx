'use client';

import { useState } from 'react';

export default function ExpandableDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 200;

  if (!text) return null;
  
  if (text.length <= maxLength) {
    return <p className="text-[15px] leading-relaxed text-gray-600 mb-10">{text}</p>;
  }

  return (
    <div className="mb-10">
      <p className="text-[15px] leading-relaxed text-gray-600 inline">
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
      </p>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="ml-2 text-[14px] font-semibold text-gray-900 hover:underline"
      >
        {isExpanded ? 'Show less' : 'Read more'}
      </button>
    </div>
  );
}
