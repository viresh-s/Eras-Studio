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
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={4}
          className={`w-full px-4 py-3 text-sm bg-white border rounded-xl outline-none resize-y transition-all duration-200 placeholder:text-gray-400 ${error ? 'border-red-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-400' : 'border-gray-200 focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400'} ${className}`}
          {...props}
        />
        {error && (
          <span className="text-red-500 text-xs font-medium">{error}</span>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
export default TextArea;
