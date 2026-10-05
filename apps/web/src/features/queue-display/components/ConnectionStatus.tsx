import React from 'react';
import { clsx } from 'clsx';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
  className?: string;
}

export function ConnectionStatus({
  isConnected,
  isReconnecting,
  className,
}: ConnectionStatusProps) {
  if (isReconnecting || !isConnected) {
    return (
      <div
        className={clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs animate-pulse',
          className
        )}
      >
        <WifiOff size={13} className="shrink-0 text-amber-600" />
        <span>Reconnecting...</span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs',
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      <Wifi size={13} className="shrink-0 text-emerald-600" />
      <span>Live Sync</span>
    </div>
  );
}
