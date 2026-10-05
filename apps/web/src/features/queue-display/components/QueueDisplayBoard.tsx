import React from 'react';
import { clsx } from 'clsx';
import type { QueueDisplayData } from '../types/queueDisplay';
import { DisplayHeader } from './DisplayHeader';
import { CurrentServing } from './CurrentServing';
import { CounterDisplay } from './CounterDisplay';
import { NextQueue } from './NextQueue';
import { EmptyQueue } from './EmptyQueue';

interface QueueDisplayBoardProps {
  data: QueueDisplayData;
  justAnnouncedTicket: string | null;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  containerRef?: React.Ref<HTMLDivElement>;
}

export function QueueDisplayBoard({
  data,
  justAnnouncedTicket,
  isFullscreen,
  onToggleFullscreen,
  soundEnabled,
  onToggleSound,
  containerRef,
}: QueueDisplayBoardProps) {
  const hasTickets =
    data.currentServing !== null ||
    data.nextTickets.length > 0 ||
    data.activeCounters.some((c) => !!c.current_ticket_number);

  return (
    <div
      ref={containerRef}
      className={clsx(
        'w-full bg-white text-ink flex flex-col justify-between font-sans select-none overflow-hidden',
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen w-screen max-h-screen'
          : 'rounded-2xl border border-hairline shadow-xs h-full min-h-[540px] max-h-[720px]'
      )}
    >
      {/* 1. TV Display Minimal Header with clean exit & sound controls */}
      <DisplayHeader
        facilityName={data.facilityName}
        serviceFilter={data.serviceFilter}
        isConnected={data.isConnected}
        isReconnecting={data.isReconnecting}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
      />

      {/* 2. Main Content Area - Strictly non-scrollable, edge-to-edge in fullscreen */}
      <main
        className={clsx(
          'flex-1 min-h-0 py-2 sm:py-3.5 flex flex-col gap-2 sm:gap-3.5 justify-between w-full overflow-hidden',
          isFullscreen ? 'px-6 sm:px-12 lg:px-16 max-w-none' : 'px-4 sm:px-8 max-w-7xl mx-auto'
        )}
      >
        {!hasTickets ? (
          <EmptyQueue />
        ) : (
          <>
            {/* Primary Hero: Now Serving */}
            <CurrentServing
              ticket={data.currentServing}
              isJustAnnounced={
                !!justAnnouncedTicket &&
                data.currentServing?.ticket_number === justAnnouncedTicket
              }
            />

            {/* Active Counters Grid */}
            <CounterDisplay
              counters={data.activeCounters}
              highlightTicketNumber={justAnnouncedTicket}
            />

            {/* Next in Line */}
            <NextQueue
              tickets={data.nextTickets}
              totalWaiting={data.totalWaiting}
            />
          </>
        )}
      </main>

      {/* 3. Bottom Guidance Ticker */}
      <footer
        className={clsx(
          'w-full bg-surface-soft/60 border-t border-hairline py-2 text-center text-xs text-muted flex flex-col sm:flex-row items-center justify-between gap-1.5 shrink-0',
          isFullscreen ? 'px-6 sm:px-12 lg:px-16' : 'px-4 sm:px-8'
        )}
      >
        <div className="flex items-center gap-2 font-sans">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-semibold text-ink">
            {data.totalWaiting} {data.totalWaiting === 1 ? 'Customer' : 'Customers'} Waiting
          </span>
          <span className="text-hairline">•</span>
          <span>{data.totalServedToday} Served Today</span>
        </div>

        <p className="font-medium text-muted font-sans">
          Please proceed to your assigned counter when your ticket is announced.
        </p>

        <div className="text-[11px] text-muted hidden lg:block font-mono">
          Synced {data.lastUpdated}
        </div>
      </footer>
    </div>
  );
}

