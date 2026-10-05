import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export function EmptyQueue() {
  return (
    <div className="w-full bg-canvas border border-hairline rounded-2xl p-6 sm:p-10 text-center flex flex-col items-center justify-center shadow-xs select-none min-h-[200px] sm:min-h-[260px] my-auto">
      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mb-3 shadow-2xs">
        <CheckCircle2 size={24} />
      </div>
      <h2 className="text-display-xs sm:text-display-sm font-semibold text-ink font-display tracking-tight">
        Queue is Currently Clear
      </h2>
      <p className="text-body-sm text-muted mt-1 max-w-md font-sans">
        There are currently no tickets waiting. When a ticket is called by staff, it will appear here immediately.
      </p>
      <div className="mt-4 px-3.5 py-1.5 rounded-full bg-surface-soft border border-hairline text-caption font-medium text-muted font-sans">
        Please obtain a ticket from reception or kiosk
      </div>
    </div>
  );
}
