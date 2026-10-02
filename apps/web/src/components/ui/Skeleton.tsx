import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Primitive skeleton block with shimmer animation
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={clsx('skeleton', className)} {...props} />;
}

/**
 * Skeleton for individual StatCard (Waiting, In Service, Completed, Avg Service)
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-canvas border border-hairline rounded-xl p-5 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/**
 * 4-card statistics row skeleton
 */
export function StatsRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for waiting queue ticket items in staff and customer views
 */
export function QueueItemSkeleton() {
  return (
    <div className="flex items-center justify-between bg-canvas border border-hairline rounded-xl p-4 shadow-2xs">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <div className="space-y-2 flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
    </div>
  );
}

/**
 * Skeleton for "Currently Serving" card in Staff Queue Dashboard
 */
export function ServingCardSkeleton() {
  return (
    <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-sm space-y-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <div className="bg-surface-soft border border-hairline rounded-lg p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-3 w-40" />
        <div className="pt-2 border-t border-hairline/60 flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      </div>

      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for appointment items
 */
export function AppointmentItemSkeleton() {
  return (
    <div className="bg-canvas border border-hairline rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/**
 * Skeleton for facility browsing card
 */
export function FacilityCardSkeleton() {
  return (
    <div className="bg-canvas border border-hairline rounded-xl p-6 space-y-4 shadow-2xs">
      <div className="flex items-start justify-between">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
      <Skeleton className="h-3 w-32" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Full page skeleton screen for page transitions and initial load
 */
export function PageSkeleton({
  hasStats = true,
  columns = 2,
}: {
  hasStats?: boolean;
  columns?: 1 | 2 | 3;
}) {
  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-hairline">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 sm:w-64" />
          <Skeleton className="h-4 w-36 sm:w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* Stats row skeleton */}
      {hasStats && <StatsRowSkeleton count={4} />}

      {/* Main Grid content skeleton */}
      <div
        className={clsx(
          'grid gap-6',
          columns === 1 && 'grid-cols-1',
          columns === 2 && 'grid-cols-1 lg:grid-cols-2',
          columns === 3 && 'grid-cols-1 lg:grid-cols-3'
        )}
      >
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="bg-canvas border border-hairline rounded-xl p-6 space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-10 w-full rounded-lg mt-4" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-3">
            <QueueItemSkeleton />
            <QueueItemSkeleton />
            <QueueItemSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
