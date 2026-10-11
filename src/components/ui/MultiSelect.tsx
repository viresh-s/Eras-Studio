'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface MultiSelectProps {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
  id?: string;
}

export default function MultiSelect({
  label,
  error,
  options,
  placeholder = 'Select options...',
  value = [],
  onChange,
  className = '',
  id,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const removeOption = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold text-[var(--color-cor-ink)]">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div
          id={selectId}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full min-h-[46px] px-4 py-2 text-sm bg-white border rounded-xl outline-none cursor-pointer transition-all duration-200 flex flex-wrap gap-2 items-center justify-between ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-[var(--color-cor-border)] focus:border-[var(--color-cor-ink)] focus:ring-1 focus:ring-[var(--color-cor-ink)]'
          } ${isOpen ? 'ring-1 ring-[var(--color-cor-ink)] border-[var(--color-cor-ink)]' : ''} ${className}`}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 items-center">
            {value.length === 0 && (
              <span className="text-[var(--color-cor-ink-light)] py-1">{placeholder}</span>
            )}
            {value.map((val) => {
              const option = options.find((o) => o.value === val);
              const displayLabel = option ? option.label : val;
              return (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F4F4ED] text-[var(--color-cor-ink)] text-xs font-medium"
                >
                  {displayLabel}
                  <button
                    type="button"
                    onClick={(e) => removeOption(e, val)}
                    className="text-[var(--color-cor-ink-light)] hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
          <ChevronDown size={16} className={`text-[var(--color-cor-ink-light)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[var(--color-cor-border-light)] rounded-xl shadow-soft-xl py-1 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
            {options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#FAF5EC] text-[var(--color-cor-ink)] font-medium' : 'text-[var(--color-cor-ink)] hover:bg-[#F4F4ED]'
                  }`}
                >
                  {option.label}
                  {isSelected && <Check size={16} className="text-[#865E16]" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {error && <span className="text-red-500 text-xs font-medium">{error}</span>}
    </div>
  );
}
