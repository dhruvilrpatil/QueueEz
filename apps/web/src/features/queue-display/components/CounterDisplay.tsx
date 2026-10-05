import React from 'react';
import { clsx } from 'clsx';
import type { DisplayCounter } from '../types/queueDisplay';

interface CounterDisplayProps {
  counters: DisplayCounter[];
  highlightTicketNumber?: string | null;
}

export function CounterDisplay({ counters, highlightTicketNumber }: CounterDisplayProps) {
  if (!counters || counters.length === 0) {
    return null;
  }

  return (
    <div className="w-full shrink-0">
      <div className="flex items-center justify-between mb-1.5 sm:mb-2 px-1">
        <h3 className="text-caption sm:text-body-sm font-semibold uppercase tracking-wider text-muted font-display">
          Active Counters
        </h3>
        <span className="text-caption text-muted font-sans">
          {counters.filter((c) => c.status !== 'offline').length} Desks Open
        </span>
      </div>

      <div
        className={clsx(
          'grid gap-2 sm:gap-3',
          counters.length <= 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : counters.length === 3
            ? 'grid-cols-1 sm:grid-cols-3'
            : 'grid-cols-2 md:grid-cols-4'
        )}
      >
        {counters.map((counter) => {
          const isServing = !!counter.current_ticket_number;
          const isHighlight =
            highlightTicketNumber &&
            counter.current_ticket_number === highlightTicketNumber;

          return (
            <div
              key={counter.id || counter.number}
              className={clsx(
                'rounded-xl border p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-300 shadow-2xs select-none min-h-[95px] sm:min-h-[110px]',
                isHighlight
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : isServing
                  ? 'bg-canvas border-hairline'
                  : 'bg-surface-soft/40 border-hairline/60'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs sm:text-sm font-semibold text-ink truncate font-display">
                  {counter.name}
                </span>
                <span
                  className={clsx(
                    'px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider shrink-0 font-sans',
                    isServing
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : counter.status === 'offline'
                      ? 'bg-surface-soft text-muted border border-hairline'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  )}
                >
                  {isServing ? 'Serving' : counter.status === 'offline' ? 'Offline' : 'Ready'}
                </span>
              </div>

              {/* Ticket Display */}
              <div className="my-1 text-center">
                {isServing ? (
                  <span
                    className={clsx(
                      'font-display font-semibold tracking-tight text-ink tabular-nums block leading-tight',
                      isHighlight ? 'text-primary scale-105' : ''
                    )}
                    style={{ fontSize: 'clamp(1.5rem, 3.2vw, 2.5rem)' }}
                  >
                    {counter.current_ticket_number}
                  </span>
                ) : (
                  <span className="text-xl text-muted/40 font-mono block">—</span>
                )}
              </div>

              {/* Footer Type */}
              <div className="text-[10px] sm:text-xs text-muted truncate text-center pt-0.5 border-t border-hairline/60 font-sans">
                {counter.service_name || counter.type || 'General Desk'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
