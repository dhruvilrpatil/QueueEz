import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppSidebar';
import {
  useQueueDisplay,
  useFullscreen,
  QueueDisplayBoard,
  playQueueChime,
} from '@/features/queue-display';
import {
  Tv,
  Maximize2,
  Volume2,
  VolumeX,
  RotateCw,
  BellRing,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function QueueDisplayPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);

  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();

  const { data, isLoading, justAnnouncedTicket, refetch } = useQueueDisplay({
    serviceId: selectedServiceId,
    soundEnabled,
  });

  const handleTestChime = () => {
    playQueueChime();
    toast.success('Chime played on audio output');
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      toast(next ? 'Sound chime enabled' : 'Sound chime muted');
      return next;
    });
  };

  // If in fullscreen, render only the board occupying the entire screen with zero scroll
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white select-none w-screen h-screen max-h-screen overflow-hidden">
        <QueueDisplayBoard
          data={data}
          justAnnouncedTicket={justAnnouncedTicket}
          isFullscreen={true}
          onToggleFullscreen={exitFullscreen}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
        />
      </div>
    );
  }

  return (
    <AppLayout role="staff">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* ── Top Header & Staff Configuration ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                <Tv size={18} />
              </div>
              <h1 className="text-display-xs font-bold text-ink tracking-tight font-display">
                Staff Queue TV Display
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Waiting Area
              </span>
            </div>
            <p className="text-body-sm text-muted">
              Dedicated high-visibility public board for waiting areas, TV monitors, and reception displays.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Test Chime */}
            <button
              type="button"
              onClick={handleTestChime}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-hairline bg-canvas hover:bg-surface-soft text-ink text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Test clinic chime audio"
            >
              <BellRing size={14} className="text-muted" />
              <span>Test Chime</span>
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-hairline text-xs font-semibold shadow-2xs transition-colors cursor-pointer ${soundEnabled
                  ? 'bg-canvas text-ink hover:bg-surface-soft'
                  : 'bg-surface-soft text-muted'
                }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 size={14} className="text-primary" />
                  <span>Sound ON</span>
                </>
              ) : (
                <>
                  <VolumeX size={14} />
                  <span>Sound OFF</span>
                </>
              )}
            </button>

            {/* Sync / Refresh */}
            <button
              type="button"
              onClick={() => {
                refetch();
                toast.success('Queue refreshed');
              }}
              className="p-2 rounded-lg border border-hairline bg-canvas hover:bg-surface-soft text-muted hover:text-ink shadow-2xs transition-colors cursor-pointer"
              title="Refresh Queue"
              aria-label="Refresh Queue"
            >
              <RotateCw size={15} />
            </button>

            {/* Fullscreen Primary CTA */}
            <button
              type="button"
              onClick={enterFullscreen}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/95 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            >
              <Maximize2 size={14} />
              <span>Enter Fullscreen</span>
            </button>
          </div>
        </div>

        {/* ── Operational Info Card ── */}
        <div className="bg-surface-soft/60 border border-hairline rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-body-sm font-bold text-ink">
              Ready for Waiting Area TV
            </h3>
            <p className="text-xs text-muted max-w-2xl">
              Connect this computer or browser tab to your waiting room monitor or TV. Click{' '}
              <strong className="text-ink">Enter Fullscreen</strong> to hide all application chrome and display the clean, high-contrast public board.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-muted shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>{data.activeCounters.length} Counters Configured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{data.totalWaiting} In Waiting Line</span>
            </div>
          </div>
        </div>

        {/* ── Live Scaled Preview Frame ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-caption font-bold uppercase tracking-wider text-muted font-display">
              Display Preview
            </span>
            <span className="text-caption text-muted">
              Auto-updates via Supabase Realtime
            </span>
          </div>

          <div className="rounded-2xl border border-hairline p-2 sm:p-3 bg-surface-soft shadow-xs overflow-hidden h-[calc(100vh-270px)] min-h-[520px] max-h-[740px]">
            <QueueDisplayBoard
              data={data}
              justAnnouncedTicket={justAnnouncedTicket}
              isFullscreen={false}
              onToggleFullscreen={enterFullscreen}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
