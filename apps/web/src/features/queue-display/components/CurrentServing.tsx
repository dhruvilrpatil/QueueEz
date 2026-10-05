import React from 'react';
import { clsx } from 'clsx';
import { ArrowRight } from 'lucide-react';
import type { DisplayTicket } from '../types/queueDisplay';

interface CurrentServingProps {
  ticket: DisplayTicket | null;
  isJustAnnounced?: boolean;
}

export function CurrentServing({ ticket, isJustAnnounced = false }: CurrentServingProps) {
  if (!ticket) {
    return (
      <div className="w-full bg-surface-soft/40 border border-hairline rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[160px] shadow-2xs select-none">
        <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-surface-soft text-muted border border-hairline tracking-wider uppercase mb-2">
          Status
        </span>
        <h2 className="text-display-xs sm:text-display-sm font-semibold text-muted font-display tracking-tight">
          Next Ticket Being Prepared
        </h2>
        <p className="text-body-sm text-muted mt-1 max-w-md font-sans">
          Please have your token number ready and watch the screen for your announcement.
        </p>
      </div>
    );
  }

  const counterLabel = ticket.counter_name || (ticket.counter_number ? `Counter ${ticket.counter_number}` : 'Service Desk');

  return (
    <div
      className={clsx(
        'relative w-full bg-canvas border rounded-2xl p-4 sm:p-6 lg:p-7 text-center shadow-xs transition-all duration-300 select-none overflow-hidden flex flex-col justify-center items-center',
        isJustAnnounced
          ? 'border-primary ring-2 ring-primary/20 shadow-card'
          : 'border-hairline'
      )}
    >
      {/* Indicator bar */}
      <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 font-display">
          {isJustAnnounced && <span className="w-2 h-2 rounded-full bg-primary animate-ping" />}
          Now Serving
        </span>
        {ticket.service_name && (
          <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-surface-soft text-muted border border-hairline font-sans">
            {ticket.service_name}
          </span>
        )}
      </div>

      {/* Very Large Ticket Number */}
      <div className="my-1 sm:my-2">
        <div
          className={clsx(
            'font-display font-semibold tracking-tight text-ink transition-all duration-300 leading-none tabular-nums',
            isJustAnnounced ? 'scale-105 text-primary' : 'scale-100'
          )}
          style={{
            fontSize: 'clamp(3.5rem, 8.5vw, 7.5rem)',
          }}
        >
          {ticket.ticket_number}
        </div>
      </div>

      {/* Target Counter Destination */}
      <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2.5">
        <span className="text-xs sm:text-sm font-medium text-muted uppercase tracking-wider font-sans">
          Please Proceed To
        </span>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white shadow-xs font-semibold text-base sm:text-xl tracking-tight font-display">
          <span>{counterLabel}</span>
          <ArrowRight size={18} className="hidden sm:inline" />
        </div>
      </div>
    </div>
  );
}

