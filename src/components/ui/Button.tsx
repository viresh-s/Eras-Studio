'use client';

import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'coral'
  | 'danger'
  | 'dark'
  | 'premium-gradient';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#141413] text-[#FAF5EC] border border-[#141413] hover:bg-black hover:border-black shadow-none',
  secondary: 'bg-white text-[#141413] border border-[#E8E8E3] hover:bg-[#F5F5F0]',
  outline: 'bg-transparent text-[#141413] border border-[#E8E8E3] hover:border-[#141413] hover:bg-[#F5F5F0]',
  ghost: 'bg-transparent text-[#6E6E69] hover:text-[#141413] hover:bg-black/5',
  coral: 'bg-[#C84B31] text-white hover:bg-[#B33F27] border border-[#C84B31]',
  danger: 'bg-[#FDF3F2] text-[#B83838] border border-[#F4CDCD] hover:bg-[#FBE8E7]',
  dark: 'bg-[#141413] text-white hover:bg-[#2A2A28] border border-[#141413]',
  'premium-gradient': 'admin-btn-premium-gradient text-white !border-[#2356FF]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-xs gap-2',
  lg: 'px-6 py-2.5 text-sm gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      children,
      isLoading,
      fullWidth,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.01 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={cn(
          'inline-flex items-center justify-center font-medium tracking-[0.02em] rounded-lg transition-all duration-150 cursor-pointer',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          (disabled || isLoading) && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0 items-center justify-center">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0 items-center justify-center">{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
