import React from 'react';
import { Clock, Check, Sparkles } from 'lucide-react';
import type { Service } from '@/types';

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onSelect: () => void;
  availabilityHint?: string;
}

export function ServiceCard({
  service,
  isSelected,
  onSelect,
  availabilityHint = 'Available today',
}: ServiceCardProps) {
  const duration = service.duration_minutes || 30;

  return (
    <div
      onClick={onSelect}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative p-4 sm:p-5 rounded-xl border transition-all cursor-pointer text-left select-none ${
        isSelected
          ? 'border-ink bg-surface-soft ring-2 ring-ink/10 shadow-xs'
          : 'border-hairline bg-canvas hover:border-ink/30 hover:bg-surface-soft/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Custom Selection Indicator */}
          <div
            className={`w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
              isSelected
                ? 'border-ink bg-ink text-white'
                : 'border-muted/40 bg-white group-hover:border-ink/50'
            }`}
          >
            {isSelected && <Check size={12} strokeWidth={3} />}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink leading-tight">
              {service.name}
            </h4>
            {service.description && (
              <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
                {service.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink bg-surface-card px-2 py-0.5 rounded border border-hairline">
                <Clock size={12} className="text-muted" />
                {duration} min
              </span>

              {availabilityHint && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {availabilityHint}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
