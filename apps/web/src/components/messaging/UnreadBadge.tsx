import React from 'react';

interface UnreadBadgeProps {
  count: number;
  variant?: 'primary' | 'subtle' | 'inline';
  className?: string;
}

export const UnreadBadge: React.FC<UnreadBadgeProps> = ({
  count,
  variant = 'primary',
  className = '',
}) => {
  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  if (variant === 'subtle') {
    return (
      <span
        className={`inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 tabular-nums ${className}`}
      >
        {displayCount}
      </span>
    );
  }

  if (variant === 'inline') {
    return (
      <span
        className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold rounded-full bg-[#111111] text-white tabular-nums ${className}`}
      >
        {displayCount}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 text-xs font-medium rounded-full bg-[#111111] text-white shadow-xs tabular-nums ${className}`}
    >
      {displayCount}
    </span>
  );
};
