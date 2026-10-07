import React from 'react';

interface CorPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function CorPageHeader({
  eyebrow = 'CAREER OPPORTUNITY RESOURCE',
  title,
  description,
  actions,
}: CorPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8E8E3] pb-6 mb-8">
      <div>
        {eyebrow && (
          <p className="text-xs uppercase tracking-wider text-[#73736C] font-semibold mb-1 font-sans">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#141413] tracking-tight leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-[#6E6E69] mt-2 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-3 self-start md:self-auto flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
