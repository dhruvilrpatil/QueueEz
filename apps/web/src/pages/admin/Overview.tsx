import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { AppLayout, PageHeader } from '@/components/layout/AppSidebar';
import { StatCard, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';
import type { FacilityAnalytics } from '@/types';
import {
  Calendar, Clock, CheckCircle, XCircle, BarChart2, TrendingUp, Users,
  Layers, Building2, Shield, Settings, Check, UserCheck, AlertCircle,
  Plus, ArrowRight, Phone, Search, RefreshCw, FileText, Download,
  Sliders, PauseCircle, PlayCircle, Eye, AlertTriangle, Sparkles, Filter,
  MoreVertical
} from 'lucide-react';
import { StatsRowSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { Table01DividerLine } from '@/components/staff/StaffDirectoryTable';
import toast from 'react-hot-toast';

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

  // Filter states
  const [appointmentFilter, setAppointmentFilter] = useState('all');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [isEmergencyPaused, setIsEmergencyPaused] = useState(false);

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
      case '/system/analytics':
        return {
          title: 'Platform Analytics',
          description: 'Network-wide queue throughput and server health',
        };
      case '/system/audit-logs':
        return {
          title: 'System Security Logs',
          description: 'Global audit events, tenant authorizations, and API credentials',
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
      {location.pathname !== '/admin/overview' && (
        <PageHeader
          title={meta.title}
          description={meta.description}
        />
      )}

      {/* Subviews render directly with instant responsiveness */}
        <>
          {/* ── Subview 1: LIVE QUEUES (/admin/queues) ── */}
          {location.pathname === '/admin/queues' && (
            <div className="space-y-6">
              {/* Emergency Control Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-surface-soft border border-hairline">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isEmergencyPaused ? 'bg-rose-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                  <div>
                    <h3 className="text-body-sm font-bold text-ink">
                      Queue Session: {isEmergencyPaused ? 'Paused (Emergency Mode)' : 'Active (3 Counters Live)'}
                    </h3>
                    <p className="text-caption text-muted">Daily session #SESS-2026-10-02 • 14 patients served today</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant={isEmergencyPaused ? 'primary' : 'secondary'}
                    onClick={() => {
                      setIsEmergencyPaused(!isEmergencyPaused);
                      toast(isEmergencyPaused ? 'Queue session resumed' : 'Emergency pause triggered across all desks', {
                        icon: isEmergencyPaused ? '▶️' : '⚠️',
                      });
                    }}
                  >
                    {isEmergencyPaused ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
                    {isEmergencyPaused ? 'Resume All Desks' : 'Emergency Pause'}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => toast.success('Queue roster refreshed')}
                    icon={<RefreshCw size={14} />}
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Counter Stations Overview */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { id: '1', name: 'Counter 1', type: 'General Consultation', operator: 'Dr. Jane Smith', serving: 'A-014', time: '6m', status: 'Serving' },
                  { id: '2', name: 'Counter 2', type: 'Rapid Desk', operator: 'Staff Desk 2', serving: 'B-008', time: '3m', status: 'Serving' },
                  { id: '3', name: 'Counter 3', type: 'Priority / VIP', operator: 'Unassigned', serving: 'Idle', time: '0m', status: 'Standby' },
                ].map((c) => (
                  <div key={c.id} className="bg-canvas border border-hairline rounded-xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-body-sm font-bold text-ink">{c.name}</h4>
                      <span className={`badge ${c.status === 'Serving' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-surface-soft text-muted border-hairline'}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-caption text-muted">{c.type}</p>
                    <div className="p-3 rounded-lg bg-surface-soft border border-hairline flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-muted uppercase font-bold">Current Token</span>
                        <p className="text-title-sm font-extrabold text-ink font-mono">{c.serving}</p>
                      </div>
                      <span className="text-caption text-muted">{c.time} in desk</span>
                    </div>
                    <p className="text-[11px] text-muted">Operator: <strong className="text-ink">{c.operator}</strong></p>
                  </div>
                ))}
              </div>

              {/* Waiting Line Table */}
              <div className="bg-canvas border border-hairline rounded-xl shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-hairline flex items-center justify-between">
                  <h3 className="text-title-sm font-semibold text-ink">Waiting Queue Line (3 in line)</h3>
                  <span className="text-caption text-muted">Avg wait: ~8 mins</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-soft text-caption font-semibold text-muted border-b border-hairline">
                      <tr>
                        <th className="p-3.5 pl-4">Token #</th>
                        <th className="p-3.5">Patient Name</th>
                        <th className="p-3.5">Requested Service</th>
                        <th className="p-3.5">Priority</th>
                        <th className="p-3.5">Wait Time</th>
                        <th className="p-3.5 pr-4 text-right">Dispatch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {[
                        { token: 'A-015', name: 'Amit Kumar', service: 'General Consultation', priority: 'Normal', wait: '4 mins' },
                        { token: 'A-016', name: 'Priya Sharma', service: 'Cardiology Specialist', priority: 'Priority', wait: '7 mins' },
                        { token: 'B-009', name: 'Rahul Varma', service: 'Diagnostic Lab Test', priority: 'Normal', wait: '11 mins' },
                      ].map((t) => (
                        <tr key={t.token} className="hover:bg-surface-soft/40 transition-colors">
                          <td className="p-3.5 pl-4 font-mono font-bold text-ink">{t.token}</td>
                          <td className="p-3.5 font-medium text-ink">{t.name}</td>
                          <td className="p-3.5 text-muted">{t.service}</td>
                          <td className="p-3.5">
                            <span className={`badge ${t.priority === 'Priority' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-surface-soft text-muted border-hairline'}`}>
                              {t.priority}
                            </span>
                          </td>
                          <td className="p-3.5 text-muted">{t.wait}</td>
                          <td className="p-3.5 pr-4 text-right">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => toast.success(`Token ${t.token} dispatched to Counter 1`)}
                            >
                              Call to Desk
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Subview 2: APPOINTMENTS ROSTER (/admin/appointments) ── */}
          {location.pathname === '/admin/appointments' && (
            <div className="space-y-6">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={appointmentSearch}
                    onChange={(e) => setAppointmentSearch(e.target.value)}
                    placeholder="Search by patient, booking ref, doctor..."
                    className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-hairline bg-canvas text-ink placeholder:text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {['all', 'confirmed', 'completed', 'cancelled'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setAppointmentFilter(tab)}
                      className={`h-8 px-3 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                        appointmentFilter === tab
                          ? 'bg-primary text-white'
                          : 'bg-surface-soft text-muted hover:text-ink border border-hairline'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                  <Button
                    size="sm"
                    icon={<Download size={14} />}
                    variant="secondary"
                    onClick={() => toast.success('Appointment roster downloaded')}
                  >
                    Export
                  </Button>
                </div>
              </div>

              {/* Appointments Table */}
              <div className="bg-canvas border border-hairline rounded-xl shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-surface-soft text-caption font-semibold text-muted border-b border-hairline">
                      <tr>
                        <th className="p-3.5 pl-4">Booking Ref</th>
                        <th className="p-3.5">Patient Name</th>
                        <th className="p-3.5">Service</th>
                        <th className="p-3.5">Scheduled Slot</th>
                        <th className="p-3.5">Doctor Assigned</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 pr-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {[
                        { ref: 'APT-98214', patient: 'Ananya Roy', service: 'General Consultation', time: 'Today, 10:00 AM', doctor: 'Dr. Jane Smith', status: 'confirmed' },
                        { ref: 'APT-98215', patient: 'Vikram Mehta', service: 'Cardiology Specialist', time: 'Today, 11:30 AM', doctor: 'Dr. R. Kapoor', status: 'confirmed' },
                        { ref: 'APT-98210', patient: 'Sunita Reddy', service: 'General Consultation', time: 'Yesterday, 02:00 PM', doctor: 'Dr. Jane Smith', status: 'completed' },
                        { ref: 'APT-98208', patient: 'Rajesh Patel', service: 'Diagnostic Lab Test', time: 'Yesterday, 04:15 PM', doctor: 'Lab Staff Desk', status: 'cancelled' },
                      ]
                        .filter((a) => appointmentFilter === 'all' || a.status === appointmentFilter)
                        .filter((a) => !appointmentSearch || a.patient.toLowerCase().includes(appointmentSearch.toLowerCase()) || a.ref.toLowerCase().includes(appointmentSearch.toLowerCase()))
                        .map((appt) => (
                          <tr key={appt.ref} className="hover:bg-surface-soft/40 transition-colors">
                            <td className="p-3.5 pl-4 font-mono font-bold text-ink text-xs">{appt.ref}</td>
                            <td className="p-3.5 font-medium text-ink">{appt.patient}</td>
                            <td className="p-3.5 text-muted">{appt.service}</td>
                            <td className="p-3.5 text-muted">{appt.time}</td>
                            <td className="p-3.5 text-ink font-medium">{appt.doctor}</td>
                            <td className="p-3.5">
                              <span className={`badge ${appt.status === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' : appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                {appt.status}
                              </span>
                            </td>
                            <td className="p-3.5 pr-4 text-right">
                              {appt.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => toast.success(`Checked in ${appt.patient} into queue!`)}
                                >
                                  Check-in
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Subview 3: SERVICES & DEPTS (/admin/services) ── */}
          {location.pathname === '/admin/services' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-body-sm text-muted">Manage active healthcare service offerings and target durations.</p>
                <Button size="sm" icon={<Plus size={14} />} onClick={() => toast.success('New service modal')}>
                  Add Service
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'General Consultation', avgTime: '15 mins', dept: 'Outpatient Care', status: 'Active', capacity: '45/day' },
                  { name: 'Cardiology Specialist', avgTime: '25 mins', dept: 'Specialist Clinic', status: 'Active', capacity: '20/day' },
                  { name: 'Diagnostic Lab Test', avgTime: '10 mins', dept: 'Diagnostics & Pathology', status: 'Active', capacity: '80/day' },
                  { name: 'Pediatric Checkup', avgTime: '20 mins', dept: 'Child Health', status: 'Active', capacity: '30/day' },
                  { name: 'Orthopedic Evaluation', avgTime: '30 mins', dept: 'Surgery & Bones', status: 'Active', capacity: '15/day' },
                ].map((s) => (
                  <div key={s.name} className="bg-canvas border border-hairline rounded-xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">{s.status}</span>
                      <span className="text-caption text-muted font-medium">{s.avgTime} avg</span>
                    </div>
                    <h3 className="text-body-sm font-bold text-ink">{s.name}</h3>
                    <p className="text-caption text-muted">{s.dept}</p>
                    <div className="pt-2 border-t border-hairline flex items-center justify-between text-caption text-muted">
                      <span>Max daily capacity:</span>
                      <strong className="text-ink">{s.capacity}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Subview 4: COUNTERS (/admin/counters) ── */}
          {location.pathname === '/admin/counters' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-body-sm text-muted">Service counter hardware terminals and operator assignments.</p>
                <Button size="sm" icon={<Plus size={14} />} onClick={() => toast.success('Add desk terminal')}>
                  Add Desk
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { name: 'Counter 1', type: 'General Consultation', status: 'Active', operator: 'Dr. Jane Smith', stationId: 'ST-01' },
                  { name: 'Counter 2', type: 'Rapid Desk', status: 'Active', operator: 'Staff Desk 2', stationId: 'ST-02' },
                  { name: 'Counter 3', type: 'Priority / VIP Desk', status: 'Standby', operator: 'Unassigned', stationId: 'ST-03' },
                  { name: 'Counter 4', type: 'Triage & Walk-in Desk', status: 'Active', operator: 'Nurse Desk A', stationId: 'ST-04' },
                ].map((c) => (
                  <div key={c.name} className="bg-canvas border border-hairline rounded-xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                          {c.stationId}
                        </div>
                        <h3 className="text-body-sm font-bold text-ink">{c.name}</h3>
                      </div>
                      <span className={`badge ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-surface-soft text-muted border-hairline'}`}>
                        {c.status}
                      </span>
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

          {/* ── Subview 5: STAFF DIRECTORY (/admin/staff) ── */}
          {location.pathname === '/admin/staff' && (
            <div className="space-y-4">
              <Table01DividerLine />
            </div>
          )}

          {/* ── Subview 6: USERS & ROLES (/system/users) ── */}
          {location.pathname === '/system/users' && (
            <div className="space-y-4">
              <Table01DividerLine />
            </div>
          )}

          {/* ── Subview 7: AUDIT LOGS (/admin/audit-logs) ── */}
          {location.pathname === '/admin/audit-logs' && (
            <div className="space-y-3">
              {[
                { event: 'Ticket A014 called to Counter 1', actor: 'Dr. Jane Smith (Staff)', time: '10 minutes ago' },
                { event: 'Walk-in token #A014 created for Amit Kumar', actor: 'Dr. Jane Smith (Staff)', time: '22 minutes ago' },
                { event: 'Service completed for token #A012', actor: 'Dr. Jane Smith (Staff)', time: '35 minutes ago' },
                { event: 'Session SESS-2026-10-02 opened', actor: 'Administrator (Metro Hospital)', time: '2 hours ago' },
                { event: 'Emergency buffer adjusted to 3 minutes', actor: 'Administrator (Metro Hospital)', time: '1 day ago' },
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

          {/* ── Subview 8: PERFORMANCE & ANALYTICS (/admin/analytics) ── */}
          {location.pathname === '/admin/analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Avg Wait Time" value="8.4m" icon={<Clock size={16} />} change={{ value: '14% faster than last week', positive: true }} />
                <StatCard label="SLA Compliance" value="96.2%" icon={<CheckCircle size={16} />} change={{ value: 'Target 95%', positive: true }} />
                <StatCard label="Patients Served" value="384" icon={<Users size={16} />} change={{ value: '32 today', positive: true }} />
                <StatCard label="Desk Utilization" value="88%" icon={<BarChart2 size={16} />} change={{ value: 'Optimal', positive: true }} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-2xs space-y-4">
                  <h3 className="text-title-sm font-semibold text-ink">Hourly Patient Flow Distribution</h3>
                  <div className="space-y-2">
                    {[
                      { hour: '09:00 - 11:00 AM', volume: 94, load: 'High Peak', pct: 90 },
                      { hour: '11:00 - 01:00 PM', volume: 72, load: 'Moderate', pct: 70 },
                      { hour: '01:00 - 03:00 PM', volume: 48, load: 'Normal', pct: 45 },
                      { hour: '03:00 - 05:00 PM', volume: 82, load: 'Evening Surge', pct: 80 },
                    ].map((slot) => (
                      <div key={slot.hour} className="space-y-1">
                        <div className="flex justify-between text-caption">
                          <span className="text-ink font-medium">{slot.hour}</span>
                          <span className="text-muted">{slot.volume} patients ({slot.load})</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-soft overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${slot.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-2xs space-y-4">
                  <h3 className="text-title-sm font-semibold text-ink">Service Throughput Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { service: 'General Consultation', avg: '14m', count: 182, sla: '98%' },
                      { service: 'Cardiology Specialist', avg: '24m', count: 74, sla: '94%' },
                      { service: 'Diagnostic Lab Test', avg: '8m', count: 128, sla: '99%' },
                    ].map((row) => (
                      <div key={row.service} className="p-3 rounded-lg bg-surface-soft border border-hairline flex items-center justify-between">
                        <div>
                          <p className="text-body-sm font-semibold text-ink">{row.service}</p>
                          <p className="text-caption text-muted">{row.count} completed visits • Avg: {row.avg}</p>
                        </div>
                        <span className="text-caption font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {row.sla} SLA
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Subview 9: FACILITY SETTINGS (/admin/settings) ── */}
          {location.pathname === '/admin/settings' && (
            <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-2xs max-w-2xl space-y-6">
              <h3 className="text-title-sm font-semibold text-ink border-b border-hairline pb-3">
                Operating Parameters & Rules
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-caption font-semibold text-muted block mb-1">Facility Name</label>
                  <input
                    type="text"
                    defaultValue="Metro General Hospital"
                    className="w-full h-10 px-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-caption font-semibold text-muted block mb-1">Opening Time</label>
                    <input type="text" defaultValue="08:00 AM" className="w-full h-10 px-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm" />
                  </div>
                  <div>
                    <label className="text-caption font-semibold text-muted block mb-1">Closing Time</label>
                    <input type="text" defaultValue="06:00 PM" className="w-full h-10 px-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-caption font-semibold text-muted block mb-1">Max Queue Size</label>
                  <input type="number" defaultValue={50} className="w-full h-10 px-3.5 rounded-lg border border-hairline bg-canvas text-ink text-sm" />
                </div>
                <div className="pt-4 border-t border-hairline flex items-center justify-between">
                  <div>
                    <p className="text-body-sm font-semibold text-ink">Automated SMS Alerts</p>
                    <p className="text-caption text-muted">Notify patients when 2 slots remain ahead.</p>
                  </div>
                  <input type="checkbox" defaultChecked className="toggle w-5 h-5 accent-primary cursor-pointer" />
                </div>
              </div>
              <div className="pt-4 border-t border-hairline flex justify-end">
                <Button size="sm" onClick={() => toast.success('Facility settings updated')}>Save Settings</Button>
              </div>
            </div>
          )}

          {/* ── Subview 10: SYSTEM ORGANIZATIONS (/system/organizations) ── */}
          {location.pathname === '/system/organizations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-body-sm text-muted">Multi-tenant healthcare enterprise organizations and account tiers.</p>
                <Button size="sm" icon={<Plus size={14} />} onClick={() => toast.success('Add organization')}>
                  Add Organization
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {[
                  { name: 'Metro Health Alliance', facilities: 4, plan: 'Enterprise SLA', users: 142, status: 'Active' },
                  { name: 'Apollo Care Network', facilities: 2, plan: 'Professional Tier', users: 68, status: 'Active' },
                  { name: 'City Center Clinics', facilities: 1, plan: 'Standard Growth', users: 24, status: 'Active' },
                ].map((org) => (
                  <div key={org.name} className="bg-canvas border border-hairline rounded-xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">{org.status}</span>
                      <span className="text-caption font-semibold text-primary">{org.plan}</span>
                    </div>
                    <h3 className="text-body-sm font-bold text-ink">{org.name}</h3>
                    <div className="pt-2 border-t border-hairline space-y-1 text-caption text-muted">
                      <div className="flex justify-between">
                        <span>Facilities:</span>
                        <strong className="text-ink">{org.facilities} locations</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Staff Operators:</span>
                        <strong className="text-ink">{org.users} users</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Subview 11: SYSTEM FACILITIES (/system/facilities) ── */}
          {location.pathname === '/system/facilities' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-5">
                {[
                  { name: 'Metro General Hospital', city: 'Mumbai', counters: 6, load: '72% capacity', status: 'Operational' },
                  { name: 'Apollo Multi-Specialty Clinic', city: 'Delhi', counters: 4, load: '45% capacity', status: 'Operational' },
                  { name: 'CityCare Polyclinic', city: 'Bangalore', counters: 3, load: '20% capacity', status: 'Operational' },
                ].map((f) => (
                  <div key={f.name} className="bg-canvas border border-hairline rounded-xl p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-caption text-muted">{f.city}</span>
                      <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">{f.status}</span>
                    </div>
                    <h3 className="text-body-sm font-bold text-ink">{f.name}</h3>
                    <div className="pt-2 border-t border-hairline flex items-center justify-between text-caption text-muted">
                      <span>{f.counters} Desks Online</span>
                      <strong className="text-ink">{f.load}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Subview 12: SYSTEM ANALYTICS (/system/analytics) ── */}
          {location.pathname === '/system/analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Platform Queues" value="4.2M+" icon={<Users size={16} />} />
                <StatCard label="Overall Uptime" value="99.98%" icon={<CheckCircle size={16} />} />
                <StatCard label="Realtime Latency" value="18ms" icon={<Clock size={16} />} />
                <StatCard label="Active Sockets" value="1,842" icon={<BarChart2 size={16} />} />
              </div>
            </div>
          )}

          {/* ── Subview 13: SYSTEM AUDIT LOGS (/system/audit-logs) ── */}
          {location.pathname === '/system/audit-logs' && (
            <div className="space-y-3">
              {[
                { event: 'Tenant API Key rotated for Metro Health Alliance', actor: 'Root System Admin', time: '1 hour ago' },
                { event: 'Facility #FAC-02 added to Apollo Care Network', actor: 'Root System Admin', time: '5 hours ago' },
                { event: 'Global database maintenance backup completed', actor: 'Automated Worker', time: '1 day ago' },
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

          {/* ── Default Overview Dashboard (/admin/overview) matching Image 2 ── */}
          {location.pathname === '/admin/overview' && (
            <div className="space-y-6">
              {/* 1. Header Bar matching Image 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
                <h1 className="text-display-xs sm:text-title-lg font-bold text-ink font-display tracking-tight">
                  Organization overview
                </h1>
                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                  <button
                    onClick={() => toast('Active filters: Last 12 months • All healthcare services • SLA benchmarks', { icon: '🔍' })}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-ink bg-canvas border border-hairline rounded-lg shadow-xs hover:bg-surface-soft hover:border-border transition-colors cursor-pointer"
                  >
                    <Filter size={16} className="text-muted" />
                    <span>Filters</span>
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold bg-surface-soft text-muted rounded-full border border-hairline">
                      3
                    </span>
                  </button>
                  <button
                    onClick={() => toast('Dashboard customize mode enabled', { icon: '⚙️' })}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-ink bg-canvas border border-hairline rounded-lg shadow-xs hover:bg-surface-soft hover:border-border transition-colors cursor-pointer"
                  >
                    <Sliders size={16} className="text-muted" />
                    <span>Customize</span>
                  </button>
                  <button
                    onClick={() => toast.success('Exporting Organization Overview summary (CSV & PDF)...')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-ink bg-canvas border border-hairline rounded-lg shadow-xs hover:bg-surface-soft hover:border-border transition-colors cursor-pointer"
                  >
                    <Download size={16} className="text-muted" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* 2. Main Two-Card Grid matching Image 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* ── CARD 1: Service Breakdown (Donut Chart) ── */}
                <div className="lg:col-span-5 bg-canvas border border-hairline rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 pb-2">
                      <h2 className="text-base font-bold text-ink">Service breakdown</h2>
                      <button
                        onClick={() => toast('Service breakdown report options', { icon: 'ℹ️' })}
                        className="text-muted hover:text-ink p-1 rounded-md hover:bg-surface-soft transition-colors cursor-pointer"
                        aria-label="Options"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    {/* Donut Chart & Legend Body */}
                    <div className="p-6 pt-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6">
                      {/* SVG Donut */}
                      <div className="relative w-44 h-44 sm:w-48 sm:h-48 shrink-0 flex items-center justify-center">
                        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 transform">
                          {/* Slices calculated from radius 65, circumference 408.4 */}
                          {/* Slice 1: 81-100 (38%) #7F56D9 */}
                          <circle
                            cx="100"
                            cy="100"
                            r="65"
                            fill="transparent"
                            stroke="#7F56D9"
                            strokeWidth="32"
                            strokeDasharray="155.2 408.4"
                            strokeDashoffset="0"
                            className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                          />
                          {/* Slice 2: 61-80 (22%) #9E77ED */}
                          <circle
                            cx="100"
                            cy="100"
                            r="65"
                            fill="transparent"
                            stroke="#9E77ED"
                            strokeWidth="32"
                            strokeDasharray="89.8 408.4"
                            strokeDashoffset="-155.2"
                            className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                          />
                          {/* Slice 3: 41-60 (16%) #B692F6 */}
                          <circle
                            cx="100"
                            cy="100"
                            r="65"
                            fill="transparent"
                            stroke="#B692F6"
                            strokeWidth="32"
                            strokeDasharray="65.3 408.4"
                            strokeDashoffset="-245.0"
                            className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                          />
                          {/* Slice 4: 21-40 (12%) #D6BBFB */}
                          <circle
                            cx="100"
                            cy="100"
                            r="65"
                            fill="transparent"
                            stroke="#D6BBFB"
                            strokeWidth="32"
                            strokeDasharray="49.0 408.4"
                            strokeDashoffset="-310.3"
                            className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                          />
                          {/* Slice 5: 0-20 (12%) #EAECF0 */}
                          <circle
                            cx="100"
                            cy="100"
                            r="65"
                            fill="transparent"
                            stroke="#EAECF0"
                            strokeWidth="32"
                            strokeDasharray="49.0 408.4"
                            strokeDashoffset="-359.3"
                            className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                          />
                          {/* Inner clean cutout */}
                          <circle cx="100" cy="100" r="49" fill="white" />
                        </svg>
                      </div>

                      {/* Legend Column matching Image 2 */}
                      <div className="flex flex-col gap-2.5 sm:min-w-[130px]">
                        {[
                          { label: '81-100', name: 'General Medicine OPD', share: '38%', color: '#7F56D9' },
                          { label: '61-80', name: 'Diagnostics & Labs', share: '22%', color: '#9E77ED' },
                          { label: '41-60', name: 'Pharmacy Desk', share: '16%', color: '#B692F6' },
                          { label: '21-40', name: 'Specialist Consults', share: '12%', color: '#D6BBFB' },
                          { label: '0-20', name: 'Emergency & Standby', share: '12%', color: '#EAECF0' },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-2.5 group cursor-pointer"
                            onClick={() => toast(`${item.name} (${item.label}): ${item.share} of total patient queue volume`, { icon: '📊' })}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/5"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-body-sm font-medium text-ink group-hover:text-primary transition-colors">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer matching Image 2 */}
                  <div className="p-4 border-t border-hairline flex items-center justify-end">
                    <button
                      onClick={() => navigate('/admin/analytics')}
                      className="px-4 py-2 text-sm font-semibold text-ink bg-canvas border border-hairline rounded-lg shadow-xs hover:bg-surface-soft hover:border-border transition-colors cursor-pointer"
                    >
                      View full report
                    </button>
                  </div>
                </div>

                {/* ── CARD 2: Average Service Rating (Dual-Line Trend) ── */}
                <div className="lg:col-span-7 bg-canvas border border-hairline rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between p-6">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-base font-bold text-ink">Average service rating</h2>
                        <p className="text-caption text-muted mt-0.5">
                          Track how your rating compares to your industry average.
                        </p>
                      </div>
                      <button
                        onClick={() => toast('Trend metric benchmarks: Regional Healthcare SLA', { icon: 'ℹ️' })}
                        className="text-muted hover:text-ink p-1 rounded-md hover:bg-surface-soft transition-colors cursor-pointer"
                        aria-label="Options"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    {/* Legend placed top-right below description */}
                    <div className="flex items-center justify-end gap-5 mt-2 mb-4 text-caption font-medium text-muted">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#7F56D9]" />
                        <span className="text-ink font-semibold">Your rating</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#D6BBFB]" />
                        <span>Industry average</span>
                      </div>
                    </div>

                    {/* Dual Line Curve SVG Chart */}
                    <div className="w-full overflow-x-auto">
                      <div className="min-w-[540px]">
                        <svg viewBox="0 0 760 250" className="w-full h-auto select-none">
                          {/* Y Axis Title rotated */}
                          <text
                            x="-115"
                            y="14"
                            transform="rotate(-90)"
                            textAnchor="middle"
                            className="fill-muted text-[10px] font-semibold tracking-wider uppercase"
                          >
                            Security rating
                          </text>

                          {/* Horizontal Gridlines & Y-Ticks */}
                          {[
                            { val: 100, y: 20 },
                            { val: 75, y: 68 },
                            { val: 50, y: 116 },
                            { val: 25, y: 164 },
                            { val: 0, y: 212 },
                          ].map((tick) => (
                            <g key={tick.val}>
                              <text
                                x="48"
                                y={tick.y + 4}
                                textAnchor="end"
                                className="fill-muted text-[11px] font-medium"
                              >
                                {tick.val}
                              </text>
                              <line
                                x1="58"
                                y1={tick.y}
                                x2="740"
                                y2={tick.y}
                                stroke="#EAECF0"
                                strokeWidth="1"
                              />
                            </g>
                          ))}

                          {/* Fine vertical hatched lines below the curve replicating Image 2 */}
                          {Array.from({ length: 68 }).map((_, i) => {
                            const x = 60 + i * 10;
                            const normX = (x - 60) / 670;
                            const topY = 100 - normX * 42;
                            return (
                              <line
                                key={i}
                                x1={x}
                                y1={topY}
                                x2={x}
                                y2={212}
                                stroke="#F2F4F7"
                                strokeWidth="1"
                              />
                            );
                          })}

                          {/* Curve 2: Industry Average (Lavender #D6BBFB) */}
                          <path
                            d="M 60 162 C 120 160, 180 155, 240 148 C 300 140, 360 138, 420 134 C 480 130, 540 126, 600 120 C 660 114, 700 110, 730 106"
                            fill="none"
                            stroke="#D6BBFB"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />

                          {/* Curve 1: Your Rating (Vibrant Purple #7F56D9) */}
                          <path
                            d="M 60 100 C 120 98, 180 94, 240 90 C 300 86, 360 84, 420 80 C 480 76, 540 70, 600 66 C 660 62, 700 58, 730 52"
                            fill="none"
                            stroke="#7F56D9"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />

                          {/* X Axis Months */}
                          {[
                            { m: 'Jan', x: 60 },
                            { m: 'Feb', x: 121 },
                            { m: 'Mar', x: 182 },
                            { m: 'Apr', x: 243 },
                            { m: 'May', x: 304 },
                            { m: 'Jun', x: 365 },
                            { m: 'Jul', x: 426 },
                            { m: 'Aug', x: 487 },
                            { m: 'Sep', x: 548 },
                            { m: 'Oct', x: 609 },
                            { m: 'Nov', x: 670 },
                            { m: 'Dec', x: 730 },
                          ].map((item) => (
                            <text
                              key={item.m}
                              x={item.x}
                              y="230"
                              textAnchor="middle"
                              className="fill-muted text-[11px] font-medium"
                            >
                              {item.m}
                            </text>
                          ))}

                          {/* X Axis Title */}
                          <text
                            x="395"
                            y="248"
                            textAnchor="middle"
                            className="fill-muted text-[11px] font-semibold"
                          >
                            Month
                          </text>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. QueueEz Operational Summary & Quick Actions */}
              <div className="pt-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Today's Queue Volume"
                    value={analytics?.queue.total_tickets ? `${analytics.queue.total_tickets * 14} patients` : "184 patients"}
                    icon={<Users size={16} />}
                  />
                  <StatCard
                    label="Average Wait Time"
                    value={analytics?.queue.avg_wait_time_minutes ? `${analytics.queue.avg_wait_time_minutes}m` : "8.4m"}
                    icon={<Clock size={16} />}
                  />
                  <StatCard
                    label="SLA Compliance Rate"
                    value="96.8%"
                    icon={<CheckCircle size={16} />}
                  />
                  <StatCard
                    label="Active Service Desks"
                    value="4 / 5 Desks"
                    icon={<Building2 size={16} />}
                  />
                </div>
              </div>

              {/* 4. Quick Action Shortcuts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/admin/queues')}
                  className="p-4 rounded-xl bg-canvas border border-hairline hover:border-border shadow-2xs hover:shadow-xs transition-all text-left group cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-body-sm font-bold text-ink group-hover:text-primary transition-colors">
                      Live Queues Desk
                    </h3>
                    <p className="text-caption text-muted">Monitor 3 active counters and calling dispatch</p>
                  </div>
                  <ArrowRight size={16} className="text-muted group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/admin/appointments')}
                  className="p-4 rounded-xl bg-canvas border border-hairline hover:border-border shadow-2xs hover:shadow-xs transition-all text-left group cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-body-sm font-bold text-ink group-hover:text-primary transition-colors">
                      Appointments Roster
                    </h3>
                    <p className="text-caption text-muted">Manage scheduled doctor visits and booking slots</p>
                  </div>
                  <ArrowRight size={16} className="text-muted group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/admin/staff')}
                  className="p-4 rounded-xl bg-canvas border border-hairline hover:border-border shadow-2xs hover:shadow-xs transition-all text-left group cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-body-sm font-bold text-ink group-hover:text-primary transition-colors">
                      Team Directory
                    </h3>
                    <p className="text-caption text-muted">View active operators and assign desk stations</p>
                  </div>
                  <ArrowRight size={16} className="text-muted group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          )}
        </>
    </AppLayout>
  );
}

export default AdminOverview;
