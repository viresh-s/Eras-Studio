'use client';

import React, { type ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from './Button';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children?: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  padded?: boolean;
  delay?: number;
  animateIn?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
  padded,
  delay = 0,
  animateIn = false,
  ...props
}: CardProps) {
  const baseAnimation = animateIn
    ? {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-50px' },
        transition: { duration: 0.5, delay, ease: 'easeOut' as const },
      }
    : {};

  const effectivePadding =
    padded !== undefined
      ? padded
        ? 'p-6'
        : ''
      : paddingClasses[padding] || 'p-6';

  return (
    <motion.div
      className={cn(
        'bg-white rounded-2xl border border-[#E8E8E3] overflow-hidden',
        effectivePadding,
        hover && 'transition-shadow duration-300 hover:shadow-soft-md',
        className
      )}
      {...baseAnimation}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`space-y-1.5 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-base font-medium tracking-tight text-[#141413] ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-[#6E6E69] leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-6 pt-4 border-t border-[#E8E8E3] flex items-center justify-between gap-3 text-xs text-[#6E6E69] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
