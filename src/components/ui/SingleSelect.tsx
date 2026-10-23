'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X, Search } from 'lucide-react';

export interface SingleSelectOption {
  value: string;
  label: string;
}

export interface SingleSelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SingleSelectOption[];
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  disabled?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  required?: boolean;
}

export default function SingleSelect({
  label,
  error,
  helperText,
  options,
  placeholder = 'Select an option...',
  value = '',
  onChange,
  className = '',
  id,
  disabled = false,
  searchable = true,
  clearable = true,
  required = false,
}: SingleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    if (isOpen && searchable) {
      const timeout = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      setSearchQuery('');
    }
  }, [isOpen, searchable]);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOption = options.find((o) => o.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div
      style={{ fontFamily: "'Poppins', sans-serif" }}
      className="w-full space-y-1 text-left"
      ref={containerRef}
    >
      {label && (
        <label
          htmlFor={selectId}
          style={{ color: '#929292', fontWeight: 500 }}
          className="block text-xs mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          id={selectId}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-white border rounded-[12px] outline-none transition-colors duration-150 flex items-center justify-between gap-2 ${
            disabled
              ? 'bg-[#F8F8F8] border-[#E8E8E3] text-[#8E8E88] cursor-not-allowed'
              : 'cursor-pointer'
          } ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-[#E2E2DC] hover:border-[#181A1F]'
          } ${isOpen ? 'ring-1 ring-[#181A1F] border-[#181A1F]' : ''} ${className}`}
        >
          <span className={`truncate flex-1 ${selectedOption ? 'text-[#181A1F]' : 'text-[#A1A1A1]'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {clearable && selectedOption && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[#8E8E88] hover:text-[#181A1F] p-0.5 rounded transition-colors cursor-pointer"
                title="Clear selection"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown
              size={15}
              className={`text-[#8E8E88] transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#181A1F]' : ''
              }`}
            />
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E2E2DC] rounded-[14px] shadow-[0_12px_36px_rgba(0,0,0,0.08)] py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
            {searchable && (
              <div className="px-3 pt-1.5 pb-2 border-b border-[#F0F0EB]">
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#F8F8F8] rounded-[8px] border border-[#E8E8E3]">
                  <Search size={13} className="text-[#8E8E88] shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search mediums..."
                    className="w-full bg-transparent text-xs text-[#181A1F] outline-none placeholder:text-[#A1A1A1]"
                    onClick={(e) => e.stopPropagation()}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-[#8E8E88] hover:text-[#181A1F]"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3.5 py-4 text-xs text-[#929292] text-center">
                  No matching options found
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <div
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={`flex items-center justify-between px-3.5 py-2.5 text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#F3F3F3] text-[#181A1F] font-semibold'
                          : 'text-[#343434] hover:bg-[#F8F8F8]'
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check size={14} className="text-[#181A1F]" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] text-red-500 font-normal mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[#929292] mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}
