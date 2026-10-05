import { format, parse, isValid } from 'date-fns';
import type { TimeSlotItem } from '../types/booking';

/**
 * Convert 24h format "09:30" or "14:00" to "09:30 AM" or "02:00 PM"
 */
export function formatTo12Hour(time24: string): string {
  if (!time24) return '';
  // Check if already in 12h format
  if (time24.includes('AM') || time24.includes('PM')) return time24;

  const [hoursStr, minsStr] = time24.split(':');
  const hours = parseInt(hoursStr, 10);
  const mins = parseInt(minsStr, 10);

  if (isNaN(hours) || isNaN(mins)) return time24;

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(displayHours).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${ampm}`;
}

/**
 * Convert 12h format "09:30 AM" to 24h "09:30"
 */
export function formatTo24Hour(time12: string): string {
  if (!time12) return '';
  if (!time12.includes('AM') && !time12.includes('PM')) {
    // Already 24h, ensure HH:MM
    const [h, m] = time12.split(':');
    return `${String(h).padStart(2, '0')}:${String(m || '00').padStart(2, '0')}`;
  }

  const parts = time12.trim().split(/\s+/);
  const [timePart, modifier] = parts;
  let [hours, minutes] = timePart.split(':').map(Number);

  if (modifier?.toUpperCase() === 'PM' && hours < 12) {
    hours += 12;
  }
  if (modifier?.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}`;
}

/**
 * Categorize a slot into morning, afternoon, evening
 */
export function getTimeSlotPeriod(time24: string): 'morning' | 'afternoon' | 'evening' {
  const [h] = time24.split(':').map(Number);
  if (h < 12) return 'morning';
  if (h < 16) return 'afternoon';
  return 'evening';
}

/**
 * Build list of TimeSlotItem objects from raw string slots returned by the API
 */
export function parseRawSlots(rawSlots: string[]): TimeSlotItem[] {
  return rawSlots.map((raw) => {
    const time24 = formatTo24Hour(raw);
    const label = formatTo12Hour(time24);
    const period = getTimeSlotPeriod(time24);
    return {
      time: time24,
      label,
      period,
      available: true,
    };
  });
}

/**
 * Generate .ics calendar file for instant download
 */
export function downloadCalendarInvite(appointment: {
  bookingReference: string;
  serviceName: string;
  facilityName: string;
  facilityAddress?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM or 12h
  durationMinutes?: number;
}) {
  const time24 = formatTo24Hour(appointment.startTime);
  const [h, m] = time24.split(':').map(Number);
  const duration = appointment.durationMinutes || 30;

  const [year, month, day] = appointment.date.split('-').map(Number);
  const startDate = new Date(year, month - 1, day, h, m);
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EzQueue//Appointment System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:ezqueue-${appointment.bookingReference}@queueez.app`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${appointment.serviceName} - ${appointment.facilityName}`,
    `DESCRIPTION:Appointment Reference: ${appointment.bookingReference}\\nService: ${appointment.serviceName}\\nFacility: ${appointment.facilityName}`,
    `LOCATION:${appointment.facilityAddress || appointment.facilityName}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `appointment-${appointment.bookingReference}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
