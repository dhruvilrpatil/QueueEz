import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { AppLayout, PageHeader } from '@/components/layout/AppSidebar';
import { StatCard, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';
import type { FacilityAnalytics } from '@/types';
import {
  Calendar, Clock, CheckCircle, XCircle, BarChart2, TrendingUp, Users,
  Layers, Building2, Shield, Settings, Check, UserCheck, AlertCircle
} from 'lucide-react';
import { StatsRowSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { Table01DividerLine } from '@/components/staff/StaffDirectoryTable';

function AdminOverview() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const facilityId = profile?.facility_id || '00000000-0000-0000-0000-000000000010';

  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ['admin-analytics', facilityId],
    queryFn: () =>
      apiClient.get<{ success: true; data: FacilityAnalytics }>(
        `/analytics/facility/${facilityId}?period=7d`
      ),
    enabled: !!facilityId,
  });

  const analytics = analyticsRes?.data;

  // Compute view metadata based on pathname
  const getViewMeta = () => {
    switch (location.pathname) {
      case '/admin/queues':
        return {
          title: 'Live Queues Management',
          description: 'Real-time monitoring across all facility counters and queues',
        };
      case '/admin/appointments':
        return {
          title: 'Facility Appointments Roster',
          description: 'Scheduled visits and booking capacity overview',
        };
      case '/admin/services':
        return {
          title: 'Services & Departments',
          description: 'Configure active healthcare services, target times, and priorities',
        };
      case '/admin/counters':
        return {
          title: 'Service Counter Desks',
          description: 'Manage active desks, hardware stations, and staff allocations',
        };
      case '/admin/staff':
        return {
          title: 'Staff Directory',
          description: 'Healthcare operators, counter desk assignments, and availability',
        };
      case '/admin/analytics':
        return {
          title: 'Performance & Analytics',
          description: 'Wait time distribution, throughput, and SLA compliance',
        };
      case '/admin/settings':
        return {
          title: 'Facility Settings',
          description: 'Working hours, buffer times, and queue management parameters',
        };
      case '/admin/audit-logs':
        return {
          title: 'Security & Audit Logs',
          description: 'Immutable record of queue events, staff actions, and access history',
        };
      case '/system/organizations':
        return {
          title: 'Organizations Management',
          description: 'Tenant organizations and healthcare enterprise networks',
        };
      case '/system/facilities':
        return {
          title: 'System Facilities',
          description: 'Multi-location facility directory and operational health',
        };
      case '/system/users':
        return {
          title: 'Global Users & Roles',
          description: 'System-wide role-based access control and user directories',
        };
      default:
        return {
          title: 'Facility Overview',
          description: 'Last 7 days performance and throughput summary',
        };
    }
  };

  const meta = getViewMeta();

  return (
    <AppLayout role="facility_admin">
      <PageHeader
        title={meta.title}
        description={meta.description}
      />

      {/* SKELETON SCREEN LOADING STATE */}
      {isLoading ? (
        <div className="space-y-6">
          <StatsRowSkeleton count={4} />
          <StatsRowSkeleton count={4} />
          <div className="bg-canvas border border-hairline rounded-xl p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ) : (
        <>
          {/* Subview: SERVICES & DEPTS */}
          {location.pathname === '/admin/services' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'General Consultation', avgTime: '15 mins', dept: 'Outpatient Care', status: 'Active' },
                  { name: 'Cardiology Specialist', avgTime: '25 mins', dept: 'Specialist Clinic', status: 'Active' },
                  { name: 'Diagnostic Lab Test', avgTime: '10 mins', dept: 'Diagnostics', status: 'Active' },
                ].map((s) => (
                  <div key={s.name} className="bg-canvas border border-hairline rounded-xl p-5 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">{s.status}</span>
                      <span className="text-caption text-muted">{s.avgTime}</span>
                    </div>
                    <h3 className="text-body-sm font-bold text-ink">{s.name}</h3>
                    <p className="text-caption text-muted">{s.dept}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subview: COUNTERS */}
          {location.pathname === '/admin/counters' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'Counter 1', type: 'General Consultation', status: 'Active', operator: 'Dr. Jane Smith' },
                  { name: 'Counter 2', type: 'Rapid Desk', status: 'Active', operator: 'Staff Desk 2' },
                  { name: 'Counter 3', type: 'Priority / VIP Desk', status: 'Standby', operator: 'Unassigned' },
                ].map((c) => (
                  <div key={c.name} className="bg-canvas border border-hairline rounded-xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-body-sm font-bold text-ink">{c.name}</h3>
                      <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">{c.status}</span>
                    </div>
                    <p className="text-caption text-muted">{c.type}</p>
                    <div className="pt-2 border-t border-hairline flex items-center justify-between text-caption">
                      <span className="text-muted">Operator:</span>
                      <span className="font-medium text-ink">{c.operator}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subview: STAFF DIRECTORY */}
          {location.pathname === '/admin/staff' && (
            <div className="space-y-4">
              <Table01DividerLine />
            </div>
          )}

          {/* Subview: USERS & ROLES (/system/users) - Dashboard section removed as requested */}
          {location.pathname === '/system/users' && (
            <div className="space-y-4">
              <Table01DividerLine />
            </div>
          )}

          {/* Subview: AUDIT LOGS */}
          {location.pathname === '/admin/audit-logs' && (
            <div className="space-y-3">
              {[
                { event: 'Ticket A014 called to Counter 1', actor: 'Dr. Jane Smith (Staff)', time: '10 minutes ago' },
                { event: 'Walk-in token #A014 created for Amit Kumar', actor: 'Dr. Jane Smith (Staff)', time: '22 minutes ago' },
                { event: 'Service completed for token #A012', actor: 'Dr. Jane Smith (Staff)', time: '35 minutes ago' },
                { event: 'Session SESS-2026-10-02 opened', actor: 'Administrator (Metro Hospital)', time: '2 hours ago' },
              ].map((log, i) => (
                <div key={i} className="bg-canvas border border-hairline rounded-xl p-4 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-muted" />
                    <div>
                      <p className="text-body-sm font-medium text-ink">{log.event}</p>
                      <p className="text-caption text-muted">Actor: {log.actor}</p>
                    </div>
                  </div>
                  <span className="text-caption text-muted">{log.time}</span>
                </div>
              ))}
            </div>
          )}

          {/* Default / Overview / Queues / Analytics subviews (Users section excluded from dashboard) */}
          {(location.pathname === '/admin/overview' ||
            location.pathname === '/admin/queues' ||
            location.pathname === '/admin/appointments' ||
            location.pathname === '/admin/analytics' ||
            (location.pathname.startsWith('/system') && location.pathname !== '/system/users') ||
            location.pathname === '/admin/settings') && (
            <>
              {/* Appointment stats */}
              <div className="mb-3">
                <h2 className="text-title-sm text-ink mb-3">Appointments (7 days)</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Total"
                    value={analytics?.appointments.total || 4}
                    icon={<Calendar size={16} />}
                  />
                  <StatCard
                    label="Completed"
                    value={analytics?.appointments.completed || 2}
                    icon={<CheckCircle size={16} />}
                  />
                  <StatCard
                    label="Cancelled"
                    value={analytics?.appointments.cancelled || 1}
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
                    value={analytics?.queue.total_tickets || 12}
                    icon={<Users size={16} />}
                  />
                  <StatCard
                    label="Completed"
                    value={analytics?.queue.completed || 10}
                    icon={<CheckCircle size={16} />}
                  />
                  <StatCard
                    label="Avg. Wait"
                    value={`${analytics?.queue.avg_wait_time_minutes || 8}m`}
                    icon={<Clock size={16} />}
                  />
                  <StatCard
                    label="Avg. Service"
                    value={`${analytics?.queue.avg_service_time_minutes || 14}m`}
                    icon={<BarChart2 size={16} />}
                  />
                </div>
              </div>

              {/* Chart placeholder */}
              <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-2xs">
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
                  <div className="space-y-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                      <div key={day} className="flex items-center gap-4">
                        <span className="text-caption text-muted w-24 shrink-0">{day}</span>
                        <div className="flex-1 flex gap-2 items-center">
                          <div
                            className="h-4 bg-primary/20 rounded-sm"
                            style={{ width: `${(idx + 3) * 12}%` }}
                          />
                          <span className="text-caption text-muted">{(idx + 2) * 3} appts</span>
                        </div>
                        <div className="flex-1 flex gap-2 items-center">
                          <div
                            className="h-4 bg-emerald-500/20 rounded-sm"
                            style={{ width: `${(idx + 2) * 10}%` }}
                          />
                          <span className="text-caption text-muted">{(idx + 1) * 3} served</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </AppLayout>
  );
}

export default AdminOverview;
