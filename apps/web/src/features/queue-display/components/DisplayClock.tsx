import React, { useState, useEffect } from 'react';

export function DisplayClock({ showSeconds = true }: { showSeconds?: boolean }) {
  const [time, setTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: true,
  });

  const dateString = time.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-center gap-3 select-none text-right">
      <div className="text-body-sm font-medium text-muted hidden sm:block font-sans">
        {dateString}
      </div>
      <div className="text-xl sm:text-2xl font-semibold font-display tracking-tight text-ink tabular-nums">
        {timeString}
      </div>
    </div>
  );
}
