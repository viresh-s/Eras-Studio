'use client';

import type { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  delay?: number;
  animateIn?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({ 
  children, 
  className, 
  hover = true, 
  padding = 'md', 
  delay = 0,
  animateIn = false,
  ...props 
}: CardProps) {
  
  const baseAnimation = animateIn ? {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-50px" },
    transition: { duration: 0.5, delay, ease: "easeOut" as const }
  } : {};

  return (
    <motion.div
      className={cn(
        'bg-white rounded-2xl shadow-[0_2px_20px_rgb(0,0,0,0.04)] overflow-hidden group',
        paddingClasses[padding],
        hover && 'transition-shadow duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]',
        className
      )}
      {...baseAnimation}
      {...props}
    >
      {children}
    </motion.div>
  );
}
