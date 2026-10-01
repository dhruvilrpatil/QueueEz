import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { AppLayout, PageHeader } from '@/components/layout/AppSidebar';
import { StatCard, SkeletonCard } from '@/components/ui/Card';
import { apiClient } from '@/lib/api-client';
import type { FacilityAnalytics } from '@/types';
import {
  Calendar, Clock, CheckCircle, XCircle, BarChart2, TrendingUp, Users
} from 'lucide-react';

function AdminOverview() {
  const { profile } = useAuth();

  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ['admin-analytics', profile?.facility_id],
    queryFn: () =>
      apiClient.get<{ success: true; data: FacilityAnalytics }>(
        `/analytics/facility/${profile?.facility_id}?period=7d`
      ),
    enabled: !!profile?.facility_id,
  });

  const analytics = analyticsRes?.data;

  return (
    <AppLayout role="facility_admin">
      <PageHeader
        title="Facility Overview"
        description="Last 7 days performance summary"
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Appointment stats */}
          <div className="mb-3">
            <h2 className="text-title-sm text-ink mb-3">Appointments (7 days)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total"
                value={analytics?.appointments.total || 0}
                icon={<Calendar size={16} />}
              />
              <StatCard
                label="Completed"
                value={analytics?.appointments.completed || 0}
                icon={<CheckCircle size={16} />}
              />
              <StatCard
                label="Cancelled"
                value={analytics?.appointments.cancelled || 0}
                icon={<XCircle size={16} />}
              />
              <StatCard
                label="No-shows"
                value={analytics?.appointments.no_shows || 0}
                icon={<XCircle size={16} />}
              />
            </div>
          </div>

          {/* Queue stats */}
          <div className="mb-6">
            <h2 className="text-title-sm text-ink mb-3">Queue Performance (7 days)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Tickets"
                value={analytics?.queue.total_tickets || 0}
                icon={<Users size={16} />}
              />
              <StatCard
                label="Completed"
                value={analytics?.queue.completed || 0}
                icon={<CheckCircle size={16} />}
              />
              <StatCard
                label="Avg. Wait"
                value={`${analytics?.queue.avg_wait_time_minutes || 0}m`}
                icon={<Clock size={16} />}
              />
              <StatCard
                label="Avg. Service"
                value={`${analytics?.queue.avg_service_time_minutes || 0}m`}
                icon={<BarChart2 size={16} />}
              />
            </div>
          </div>

          {/* Chart placeholder */}
          <div className="bg-canvas border border-hairline rounded-xl p-6">
            <h3 className="text-title-sm text-ink mb-4">Daily Activity (7 days)</h3>
            {analytics?.chart && analytics.chart.length > 0 ? (
              <div className="space-y-2">
                {analytics.chart.map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-caption text-muted w-24 shrink-0">{day.date}</span>
                    <div className="flex-1 flex gap-2 items-center">
                      <div
                        className="h-4 bg-brand-accent/20 rounded-sm"
                        style={{ width: `${Math.min((day.appointments / 20) * 100, 100)}%` }}
                      />
                      <span className="text-caption text-muted">{day.appointments} appts</span>
                    </div>
                    <div className="flex-1 flex gap-2 items-center">
                      <div
                        className="h-4 bg-success/20 rounded-sm"
                        style={{ width: `${Math.min((day.completed / 20) * 100, 100)}%` }}
                      />
                      <span className="text-caption text-muted">{day.completed} done</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-muted">No data available for this period.</p>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}

export default AdminOverview;
