'use client';

import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-4 py-3 text-sm bg-white border rounded-xl outline-none transition-all duration-200 placeholder:text-gray-400 ${error ? 'border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-400' : 'border-gray-200 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400'} ${className}`}
          {...props}
        />
        {error && (
          <span className="text-red-500 text-xs font-medium">{error}</span>
        )}
        {helperText && !error && (
          <span className="text-gray-400 text-xs">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
