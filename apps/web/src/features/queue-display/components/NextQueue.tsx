import React from 'react';
import type { DisplayTicket } from '../types/queueDisplay';

interface NextQueueProps {
  tickets: DisplayTicket[];
  totalWaiting: number;
}

export function NextQueue({ tickets, totalWaiting }: NextQueueProps) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="w-full bg-surface-soft/30 border border-hairline rounded-xl px-3 py-2 flex items-center justify-between text-xs text-muted select-none shrink-0 font-sans">
        <span>No tickets currently waiting in line</span>
        <span className="font-semibold text-ink">0 in queue</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface-soft/40 border border-hairline rounded-xl px-3.5 py-2 sm:py-2.5 select-none shadow-2xs shrink-0">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <div className="flex items-center gap-2">
          <span className="text-caption font-semibold uppercase tracking-wider text-muted font-display">
            Next In Line
          </span>
          <span className="px-2 py-0.2 rounded-full text-[10px] sm:text-[11px] font-semibold bg-primary text-white font-sans">
            {totalWaiting} Waiting
          </span>
        </div>
        <span className="text-[11px] text-muted hidden sm:inline font-sans">
          Please be seated nearby
        </span>
      </div>

      {/* Ticket Badges Row */}
      <div className="flex items-center gap-2 flex-wrap">
        {tickets.map((t, idx) => {
          const isPriority = t.priority === 'emergency' || t.priority === 'priority';

          return (
            <div
              key={t.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-canvas border border-hairline shadow-2xs transition-all"
            >
              <span className="text-[11px] font-medium text-muted font-sans">
                #{idx + 1}
              </span>
              <span className="text-xs sm:text-sm font-semibold font-display text-ink tracking-tight">
                {t.ticket_number}
              </span>
              {isPriority && (
                <span className="px-1 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 font-sans">
                  Priority
                </span>
              )}
            </div>
          );
        })}

        {totalWaiting > tickets.length && (
          <div className="px-2.5 py-1 rounded-lg bg-surface-soft text-[11px] font-medium text-muted border border-hairline font-sans">
            +{totalWaiting - tickets.length} more
          </div>
        )}
      </div>
    </div>
  );
}

