import React from 'react';
import { clsx } from 'clsx';
import type { TicketStatus, AppointmentStatus, CounterStatus } from '@/types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange' | 'violet' | 'emerald';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-card text-ink',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-brand-accent/10 text-brand-accent',
  orange: 'bg-badge-orange/10 text-badge-orange',
  violet: 'bg-badge-violet/10 text-badge-violet',
  emerald: 'bg-badge-emerald/10 text-badge-emerald',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ── Ticket Status Badge ──────────────────────────────────────────
const ticketStatusConfig: Record<TicketStatus, { label: string; variant: BadgeVariant }> = {
  waiting: { label: 'Waiting', variant: 'default' },
  called: { label: 'Called', variant: 'warning' },
  checked_in: { label: 'Checked In', variant: 'info' },
  in_service: { label: 'In Service', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  skipped: { label: 'Skipped', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'error' },
  no_show: { label: 'No Show', variant: 'error' },
  transferred: { label: 'Transferred', variant: 'orange' },
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const config = ticketStatusConfig[status] || { label: status, variant: 'default' as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ── Appointment Status Badge ─────────────────────────────────────
const appointmentStatusConfig: Record<AppointmentStatus, { label: string; variant: BadgeVariant }> = {
  scheduled: { label: 'Scheduled', variant: 'info' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  checked_in: { label: 'Checked In', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
  no_show: { label: 'No Show', variant: 'error' },
  rescheduled: { label: 'Rescheduled', variant: 'orange' },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const config = appointmentStatusConfig[status] || { label: status, variant: 'default' as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ── Counter Status Badge ─────────────────────────────────────────
const counterStatusConfig: Record<CounterStatus, { label: string; variant: BadgeVariant }> = {
  available: { label: 'Available', variant: 'success' },
  busy: { label: 'Busy', variant: 'warning' },
  paused: { label: 'Paused', variant: 'orange' },
  offline: { label: 'Offline', variant: 'default' },
};

export function CounterStatusBadge({ status }: { status: CounterStatus }) {
  const config = counterStatusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// ── Priority Badge ───────────────────────────────────────────────
const priorityConfig = {
  normal: { label: 'Normal', variant: 'default' as BadgeVariant },
  priority: { label: 'Priority', variant: 'warning' as BadgeVariant },
  emergency: { label: 'Emergency', variant: 'error' as BadgeVariant },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
