import React from 'react';
import { clsx } from 'clsx';
import type { BadgeTypes } from './badge-types';

export type BadgeColor<T = any> =
  | 'gray'
  | 'brand'
  | 'success'
  | 'warning'
  | 'error'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'orange';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  size?: 'sm' | 'md' | 'lg';
  type?: BadgeTypes;
  children: React.ReactNode;
  className?: string;
}

const colorStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  gray: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  },
  brand: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  success: {
    bg: 'bg-[#ecfdf3]',
    text: 'text-[#027a48]',
    border: 'border-[#abefc6]',
    dot: 'bg-[#12b76a]',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  error: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
    dot: 'bg-pink-500',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5 font-medium',
  md: 'text-xs px-2.5 py-1 font-medium',
  lg: 'text-sm px-3 py-1 font-medium',
};

export function Badge({
  color = 'gray',
  size = 'sm',
  type = 'badge',
  children,
  className,
  ...props
}: BadgeProps) {
  const palette = colorStyles[color] || colorStyles.gray;

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border transition-colors',
        palette.bg,
        palette.text,
        palette.border,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function BadgeWithDot({
  color = 'gray',
  size = 'sm',
  type = 'modern',
  children,
  className,
  ...props
}: BadgeProps) {
  const palette = colorStyles[color] || colorStyles.gray;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border',
        palette.bg,
        palette.text,
        palette.border,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', palette.dot)} />
      {children}
    </span>
  );
}
