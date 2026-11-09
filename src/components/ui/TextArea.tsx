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
          className={`w-full px-3.5 py-2.5 text-sm ${
            error ? 'input-error-border-12' : 'input-gradient-border-12'
          } outline-none resize-y placeholder:text-[#A1A1A1] ${className}`}
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
