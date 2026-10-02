import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export interface PaginationPageMinimalCenterProps {
  page?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

export function PaginationPageMinimalCenter({
  page: initialPage = 1,
  total = 10,
  onPageChange,
  className,
}: PaginationPageMinimalCenterProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const handlePrev = () => {
    if (currentPage > 1) {
      const next = currentPage - 1;
      setCurrentPage(next);
      onPageChange?.(next);
    }
  };

  const handleNext = () => {
    if (currentPage < total) {
      const next = currentPage + 1;
      setCurrentPage(next);
      onPageChange?.(next);
    }
  };

  return (
    <div
      className={clsx(
        'flex items-center justify-between border-t border-hairline bg-white',
        className
      )}
    >
      <button
        type="button"
        onClick={handlePrev}
        disabled={currentPage <= 1}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline text-xs font-semibold text-ink hover:bg-surface-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <ChevronLeft size={14} />
        <span>Previous</span>
      </button>

      <span className="text-xs font-medium text-muted">
        Page <span className="font-semibold text-ink">{currentPage}</span> of{' '}
        <span className="font-semibold text-ink">{total}</span>
      </span>

      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage >= total}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline text-xs font-semibold text-ink hover:bg-surface-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <span>Next</span>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

export default PaginationPageMinimalCenter;
