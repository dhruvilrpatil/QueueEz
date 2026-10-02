import React, { useState } from 'react';
import { clsx } from 'clsx';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
  initials?: string;
  className?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const sizeClasses: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', dot: 'w-1.5 h-1.5' },
  sm: { container: 'w-8 h-8', text: 'text-xs', dot: 'w-2 h-2' },
  md: { container: 'w-9 h-9', text: 'text-xs', dot: 'w-2.5 h-2.5' },
  lg: { container: 'w-10 h-10', text: 'text-sm', dot: 'w-2.5 h-2.5' },
  xl: { container: 'w-12 h-12', text: 'text-base', dot: 'w-3 h-3' },
};

// Pastel fills from DESIGN.md
const pastelBgs = [
  'bg-[#fee4e2] text-[#d92d20]',
  'bg-[#fef0c7] text-[#b54708]',
  'bg-[#d1fadf] text-[#027a48]',
  'bg-[#e0f2fe] text-[#026aa2]',
  'bg-[#f4ebff] text-[#6941c6]',
  'bg-[#fdf2fa] text-[#c11574]',
];

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  alt = '',
  size = 'md',
  initials,
  status,
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeConfig = sizeClasses[size] || sizeClasses.md;

  const fallbackLetters = initials || getInitials(alt);

  // Deterministic pastel color choice based on name
  const charCode = (alt || fallbackLetters).charCodeAt(0) || 0;
  const colorClass = pastelBgs[charCode % pastelBgs.length];

  return (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center shrink-0 rounded-full font-semibold select-none overflow-visible ring-1 ring-black/5',
        sizeConfig.container,
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <div
          className={clsx(
            'w-full h-full rounded-full flex items-center justify-center font-medium font-sans',
            sizeConfig.text,
            colorClass
          )}
        >
          {fallbackLetters}
        </div>
      )}

      {status && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            sizeConfig.dot,
            status === 'online' && 'bg-emerald-500',
            status === 'offline' && 'bg-gray-400',
            status === 'busy' && 'bg-rose-500',
            status === 'away' && 'bg-amber-400'
          )}
        />
      )}
    </div>
  );
}

export default Avatar;
