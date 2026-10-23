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
    <div style={{ fontFamily: "'Poppins', sans-serif" }} className="w-full space-y-1 text-left" ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          style={{ color: '#929292', fontWeight: 500 }}
          className="block text-xs mb-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        <div
          id={selectId}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border rounded-[12px] outline-none cursor-pointer transition-colors duration-150 flex flex-wrap gap-2 items-center justify-between ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-[#E2E2DC] focus:border-[#181A1F] focus:ring-1 focus:ring-[#181A1F]'
          } ${isOpen ? 'ring-1 ring-[#181A1F] border-[#181A1F]' : ''} ${className}`}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 items-center">
            {value.length === 0 && (
              <span className="text-[#A1A1A1] py-1">{placeholder}</span>
            )}
            {value.map((val) => {
              const option = options.find((o) => o.value === val);
              const displayLabel = option ? option.label : val;
              return (
                <span
                  key={val}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#F3F3F3] border border-[#E2E2DC] text-[#181A1F] text-xs font-medium"
                >
                  {displayLabel}
                  <button
                    type="button"
                    onClick={(e) => removeOption(e, val)}
                    className="text-[#8E8E88] hover:text-black transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
          <ChevronDown size={15} className={`text-[#8E8E88] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#181A1F]' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E2E2DC] rounded-[14px] shadow-[0_10px_30px_rgba(0,0,0,0.06)] py-1.5 z-50 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1">
            {options.map((option) => {
              const isSelected = value.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={`flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#F3F3F3] text-[#181A1F] font-semibold' : 'text-[#343434] hover:bg-[#F8F8F8]'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check size={14} className="text-[#181A1F]" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {error && <p className="text-[11px] text-red-500 font-normal mt-1">{error}</p>}
    </div>
  );
}
