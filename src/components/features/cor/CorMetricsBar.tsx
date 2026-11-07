import React from 'react';

interface CorMetricsBarProps {
  metrics: {
    opportunitiesFound: number;
    applicationsSubmitted: number;
    interviews: number;
    offers: number;
  };
}

export default function CorMetricsBar({ metrics }: CorMetricsBarProps) {
  const items = [
    { label: 'Opportunities Found', value: metrics.opportunitiesFound },
    { label: 'Applications Submitted', value: metrics.applicationsSubmitted },
    { label: 'Interviews', value: metrics.interviews },
    { label: 'Offers', value: metrics.offers },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
      {items.map((item, i) => (
        <div
          key={i}
          className="bg-white border border-[#E8E8E3] rounded-2xl p-4 sm:p-5 hover:border-[#D5D3CE] transition-all"
        >
          <p className="text-xs text-[#73736C] font-normal font-sans">
            {item.label}
          </p>
          <p className="font-sans text-2xl sm:text-3xl font-normal text-[#141413] mt-2">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
