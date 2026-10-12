'use client';

import React, { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, children, className = '', id, disabled, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-[#4A4A45] tracking-tight"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            className={`w-full appearance-none bg-white text-[#141413] text-sm border ${
              error ? 'border-[#D94E4E]' : 'border-[#E8E8E3]'
            } rounded-lg py-2.5 pl-3.5 pr-9 transition-colors duration-150 focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F] disabled:bg-[#F7F7F4] disabled:text-[#8E8E88] disabled:cursor-not-allowed cursor-pointer ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="pointer-events-none absolute right-3 text-[#71716D] flex items-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error ? (
          <p className="text-xs text-[#B83838] font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#71716D]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
