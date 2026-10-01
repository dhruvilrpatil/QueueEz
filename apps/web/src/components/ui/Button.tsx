import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-active disabled:bg-primary-disabled disabled:text-muted',
  secondary: 'bg-canvas text-ink border border-hairline hover:bg-surface-soft',
  ghost: 'bg-transparent text-ink hover:bg-surface-soft',
  danger: 'bg-error text-white hover:opacity-90',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs h-8',
  md: 'px-5 py-2.5 text-button h-10',
  lg: 'px-6 py-3 text-body-md h-12',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  iconRight,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors cursor-pointer select-none',
        variantClasses[variant],
        sizeClasses[size],
        (disabled || isLoading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
      {iconRight && !isLoading && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}
