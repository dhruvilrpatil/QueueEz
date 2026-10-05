import React from 'react';
import { clsx } from 'clsx';
import { Clock as ClockIcon, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { DisplayClock } from './DisplayClock';
import { ConnectionStatus } from './ConnectionStatus';

interface DisplayHeaderProps {
  facilityName: string;
  serviceFilter: string;
  isConnected: boolean;
  isReconnecting: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export function DisplayHeader({
  facilityName,
  serviceFilter,
  isConnected,
  isReconnecting,
  isFullscreen,
  onToggleFullscreen,
  soundEnabled,
  onToggleSound,
}: DisplayHeaderProps) {
  return (
    <header
      className={clsx(
        'w-full bg-canvas border-b border-hairline py-2.5 sm:py-3 flex items-center justify-between gap-4 select-none shrink-0 shadow-2xs',
        isFullscreen ? 'px-6 sm:px-12 lg:px-16' : 'px-4 sm:px-8'
      )}
    >
      {/* Brand & Facility Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
          <ClockIcon size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg sm:text-xl font-semibold text-ink tracking-tight font-display">
              QueueEz
            </span>
            <span className="text-muted font-normal text-xs sm:text-sm hidden sm:inline">•</span>
            <span className="text-xs sm:text-sm font-semibold text-ink truncate font-sans">
              {facilityName}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted font-medium truncate">
            {serviceFilter}
          </p>
        </div>
      </div>

      {/* Clock, Status & Fullscreen Actions */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <ConnectionStatus isConnected={isConnected} isReconnecting={isReconnecting} />
        <DisplayClock showSeconds={true} />

        {/* In fullscreen mode: subtle controls in the header */}
        {isFullscreen && onToggleSound && (
          <button
            type="button"
            onClick={onToggleSound}
            className="p-1.5 rounded-lg border border-hairline hover:bg-surface-soft text-muted hover:text-ink transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute announcement chime' : 'Enable announcement chime'}
            aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 size={16} className="text-primary" /> : <VolumeX size={16} />}
          </button>
        )}

        {isFullscreen && onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-hairline bg-surface-soft hover:bg-surface-card text-ink text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Exit Fullscreen (ESC)"
          >
            <Minimize2 size={13} />
            <span className="hidden sm:inline">Exit (ESC)</span>
          </button>
        )}
      </div>
    </header>
  );
}

