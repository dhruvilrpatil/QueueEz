import React, { useState } from 'react';
import { format, addDays, isSameDay, parseISO, isToday } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  daysAhead?: number;
}

export function DateSelector({
  selectedDate,
  onSelectDate,
  daysAhead = 7,
}: DateSelectorProps) {
  const [showFullCalendar, setShowFullCalendar] = useState(false);

  // Generate date shortcuts starting from today
  const dateOptions = Array.from({ length: daysAhead }, (_, i) => {
    const d = addDays(new Date(), i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const isCurrent = isToday(d);
    const isTomorrow = isSameDay(d, addDays(new Date(), 1));

    let label = format(d, 'EEE, MMM d');
    let sublabel = format(d, 'EEE');

    if (isCurrent) {
      sublabel = 'Today';
    } else if (isTomorrow) {
      sublabel = 'Tomorrow';
    }

    return {
      date: d,
      dateStr,
      label,
      sublabel,
      dayNum: format(d, 'd'),
      dayName: format(d, 'EEE'),
      isCurrent,
    };
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
          Choose a date
        </label>
        <button
          type="button"
          onClick={() => setShowFullCalendar(!showFullCalendar)}
          className="text-xs font-semibold text-primary hover:text-primary-active flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <CalendarIcon size={13} />
          <span>{showFullCalendar ? 'Quick dates' : 'View calendar'}</span>
        </button>
      </div>

      {showFullCalendar ? (
        <div className="p-4 bg-surface-soft border border-hairline rounded-xl space-y-2 animate-in fade-in duration-150">
          <p className="text-xs text-muted">Select any future date for your appointment:</p>
          <input
            type="date"
            value={selectedDate}
            min={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => {
              if (e.target.value) {
                onSelectDate(e.target.value);
              }
            }}
            className="w-full h-10 px-3 rounded-lg border border-hairline bg-white text-xs font-semibold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
          />
        </div>
      ) : (
        /* Horizontal Date Strip */
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {dateOptions.map((opt) => {
            const isSelected = selectedDate === opt.dateStr;
            return (
              <button
                key={opt.dateStr}
                type="button"
                onClick={() => onSelectDate(opt.dateStr)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'border-ink bg-surface-soft ring-2 ring-ink/10 text-ink shadow-2xs font-bold'
                    : 'border-hairline bg-canvas hover:border-ink/20 hover:bg-surface-soft/60 text-muted'
                }`}
              >
                <span className="text-[11px] font-medium leading-none mb-1">
                  {opt.sublabel}
                </span>
                <span
                  className={`text-base font-bold leading-none ${
                    isSelected ? 'text-ink' : 'text-ink/80'
                  }`}
                >
                  {opt.dayNum}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
