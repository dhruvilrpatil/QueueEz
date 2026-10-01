import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'soft' | 'dark';
}

const paddingClasses = { sm: 'p-4', md: 'p-6', lg: 'p-8' };
const variantClasses = {
  default: 'bg-canvas border border-hairline',
  soft: 'bg-surface-card',
  dark: 'bg-surface-dark text-on-dark',
};

export function Card({ children, className, padding = 'md', variant = 'default' }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl',
        paddingClasses[padding],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
}

// Skeleton card for loading states
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-canvas border border-hairline rounded-xl p-6 space-y-4', className)}>
      <div className="skeleton h-4 w-1/3 rounded" />
      <div className="skeleton h-8 w-2/3 rounded" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-4/5 rounded" />
    </div>
  );
}

// Stat card used in dashboards
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({ label, value, icon, change, className }: StatCardProps) {
  return (
    <div className={clsx('bg-canvas border border-hairline rounded-xl p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-body-sm text-muted font-medium">{label}</span>
        {icon && (
          <span className="w-9 h-9 flex items-center justify-center bg-surface-card rounded-md text-muted">
            {icon}
          </span>
        )}
      </div>
      <div className="text-display-sm font-semibold text-ink">{value}</div>
      {change && (
        <p className={clsx('text-caption mt-1.5', change.positive ? 'text-success' : 'text-error')}>
          {change.positive ? '↑' : '↓'} {change.value}
        </p>
      )}
    </div>
  );
}

// Empty state
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-14 h-14 flex items-center justify-center bg-surface-card rounded-xl mb-4 text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-title-sm text-ink mb-1">{title}</h3>
      {description && <p className="text-body-sm text-muted max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Error state
interface ErrorStateProps {
  title?: string;
  message?: string;
  retry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, retry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 flex items-center justify-center bg-error/10 rounded-xl mb-4">
        <span className="text-error text-xl">!</span>
      </div>
      <h3 className="text-title-sm text-ink mb-1">{title}</h3>
      {message && <p className="text-body-sm text-muted max-w-sm mb-4">{message}</p>}
      {retry && (
        <button onClick={retry} className="btn-secondary text-sm">
          Try again
        </button>
      )}
    </div>
  );
}
