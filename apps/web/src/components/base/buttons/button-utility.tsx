import React from 'react';
import { clsx } from 'clsx';

export interface ButtonUtilityProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'xs' | 'sm' | 'md';
  color?: 'primary' | 'secondary' | 'tertiary';
  tooltip?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
}

export function ButtonUtility({
  size = 'xs',
  color = 'tertiary',
  tooltip,
  icon: Icon,
  className,
  title,
  ...props
}: ButtonUtilityProps) {
  const sizeStyles = {
    xs: 'w-7 h-7 p-1 text-xs',
    sm: 'w-8 h-8 p-1.5 text-sm',
    md: 'w-9 h-9 p-2 text-base',
  };

  const iconSizes = {
    xs: 14,
    sm: 16,
    md: 18,
  };

  const colorStyles = {
    primary: 'text-white bg-primary hover:bg-primary-active border border-primary',
    secondary: 'text-ink bg-white hover:bg-surface-soft border border-hairline',
    tertiary: 'text-muted hover:text-ink hover:bg-surface-soft border border-transparent',
  };

  return (
    <button
      type="button"
      title={tooltip || title}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        sizeStyles[size],
        colorStyles[color],
        className
      )}
      {...props}
    >
      {Icon && <Icon size={iconSizes[size]} />}
    </button>
  );
}

export default ButtonUtility;
