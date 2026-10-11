'use client';

import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold text-[var(--color-cor-ink)]"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full px-4 py-3 text-sm bg-white border rounded-xl outline-none cursor-pointer transition-all duration-200 ${error ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[var(--color-cor-border)] focus:border-[var(--color-cor-ink)] focus:ring-1 focus:ring-[var(--color-cor-ink)]'} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span className="text-red-500 text-xs font-medium">{error}</span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
