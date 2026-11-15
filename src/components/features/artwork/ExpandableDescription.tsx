'use client';

import { useState } from 'react';

export default function ExpandableDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 200;

  if (!text) return null;
  
  if (text.length <= maxLength) {
    return (
      <p
        className="text-xs sm:text-[13px] leading-relaxed text-[#3A3A38] font-normal"
        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
      >
        {text}
      </p>
    );
  }

  return (
    <div>
      <p
        className="text-xs sm:text-[13px] leading-relaxed text-[#3A3A38] font-normal inline"
        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
      >
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
      </p>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="ml-2 text-xs font-medium text-[#1345EE] hover:underline cursor-pointer"
        style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
      >
        {isExpanded ? 'Show less' : 'Read more'}
      </button>
    </div>
  );
}
