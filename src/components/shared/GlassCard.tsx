'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  noPadding?: boolean;
}

export function GlassCard({ children, className, hover = false, onClick, noPadding }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={hover ? { y: -3, transition: { duration: 0.25, ease: 'easeOut' } } : undefined}
      onClick={onClick}
      className={cn(
        'rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-2xl shadow-[0_2px_20px_rgba(0,0,0,0.15)]',
        'light:border-black/[0.06] light:bg-white/80 light:shadow-[0_1px_12px_rgba(0,0,0,0.04)]',
        hover && 'cursor-pointer',
        onClick && 'cursor-pointer',
        !noPadding && 'p-6',
        className
      )}
    >
      {children}
    </motion.div>
  );
}