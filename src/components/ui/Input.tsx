'use client';

import React, { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div style={{ fontFamily: "'Poppins', sans-serif" }} className="w-full space-y-1 text-left">
        {label && (
          <label
            htmlFor={inputId}
            style={{ color: '#929292', fontWeight: 500 }}
            className="block text-xs mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[#8E8E88] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            style={{
              fontFamily: "'Poppins', sans-serif",
              color: disabled ? '#8E8E88' : '#181A1F',
            }}
            className={`w-full bg-white text-sm placeholder:text-[#A1A1A1] border ${
              error ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-[#E2E2DC] focus:border-[#181A1F] focus:ring-1 focus:ring-[#181A1F]'
            } rounded-[12px] py-2.5 ${leftIcon ? 'pl-10' : 'pl-3.5'} ${
              rightIcon ? 'pr-10' : 'pr-3.5'
            } transition-colors duration-150 outline-none disabled:bg-[#F8F8F8] disabled:hover:bg-[#F8F8F8] disabled:border-[#E8E8E3] disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-[#8E8E88] flex items-center">
              {rightIcon}
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
);

Input.displayName = 'Input';
export default Input;
