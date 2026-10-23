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
  ({ label, error, helperText, options, placeholder, children, className = '', id, disabled, style, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div style={{ fontFamily: "'Poppins', sans-serif" }} className="w-full space-y-1 text-left">
        {label && (
          <label
            htmlFor={selectId}
            style={{ color: '#929292', fontWeight: 500 }}
            className="block text-xs mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            style={{
              fontFamily: "'Poppins', sans-serif",
              color: disabled ? '#8E8E88' : '#181A1F',
              ...style,
            }}
            className={`w-full appearance-none bg-white text-sm border ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border-[#E2E2DC] focus:border-[#181A1F] focus:ring-1 focus:ring-[#181A1F]'
            } rounded-[12px] py-2.5 pl-3.5 pr-9 transition-colors duration-150 outline-none disabled:bg-[#F8F8F8] disabled:border-[#E8E8E3] disabled:text-[#8E8E88] disabled:cursor-not-allowed cursor-pointer ${className}`}
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
          <div className="pointer-events-none absolute right-3.5 text-[#8E8E88] flex items-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error ? (
          <p className="text-[11px] text-red-500 font-normal mt-1">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-[#929292] mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
