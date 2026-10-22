'use client';

import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div style={{ fontFamily: "'Poppins', sans-serif" }} className="w-full space-y-1 text-left">
        {label && (
          <label
            htmlFor={textareaId}
            style={{ color: '#929292', fontWeight: 500 }}
            className="block text-xs mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={4}
          style={{
            fontFamily: "'Poppins', sans-serif",
            color: '#181A1F',
          }}
          className={`w-full px-3.5 py-2.5 text-sm bg-white border ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#E2E2DC] focus:border-[#181A1F] focus:ring-1 focus:ring-[#181A1F]'
          } rounded-[12px] outline-none resize-y transition-colors duration-150 placeholder:text-[#A1A1A1] ${className}`}
          {...props}
        />
        {error && (
          <p className="text-[11px] text-red-500 font-normal mt-1">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
export default TextArea;
