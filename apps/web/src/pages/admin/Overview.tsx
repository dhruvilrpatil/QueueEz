import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { AppLayout, PageHeader } from '@/components/layout/AppSidebar';
import { StatCard, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';
import type { FacilityAnalytics } from '@/types';
import {
  Calendar, Clock, CheckCircle, XCircle, BarChart2, TrendingUp, Users,
  Layers, Building2, Shield, Settings, Check, UserCheck, AlertCircle,
  Plus, ArrowRight, Phone, Search, RefreshCw, FileText, Download,
  Sliders, PauseCircle, PlayCircle, Eye, AlertTriangle, Sparkles, Filter,
  MoreVertical, Activity, Zap, Info
} from 'lucide-react';
import { StatsRowSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { Table01DividerLine } from '@/components/staff/StaffDirectoryTable';
import toast from 'react-hot-toast';

const SERVICE_BREAKDOWN_DATA = [
  {
    id: 0,
    range: '81-100',
    name: 'General Medicine OPD',
    share: '38%',
    percent: 38,
    volume: 148,
    avgWait: '11m',
    color: '#7F56D9',
    strokeDasharray: '155.2 408.4',
    strokeDashoffset: '0',
    desk: 'Counters 1 & 2',
    trend: '+4.8% vs last week',
  },
  {
    id: 1,
    range: '61-80',
    name: 'Diagnostics & Labs',
    share: '22%',
    percent: 22,
    volume: 86,
    avgWait: '8m',
    color: '#9E77ED',
    strokeDasharray: '89.8 408.4',
    strokeDashoffset: '-155.2',
    desk: 'Desk 3',
    trend: '+2.1% vs last week',
  },
  {
    id: 2,
    range: '41-60',
    name: 'Pharmacy Desk',
    share: '16%',
    percent: 16,
    volume: 62,
    avgWait: '4m',
    color: '#B692F6',
    strokeDasharray: '65.3 408.4',
    strokeDashoffset: '-245.0',
    desk: 'Dispensary 1',
    trend: '-1.4% vs last week',
  },
  {
    id: 3,
    range: '21-40',
    name: 'Specialist Consults',
    share: '12%',
    percent: 12,
    volume: 46,
    avgWait: '18m',
    color: '#D6BBFB',
    strokeDasharray: '49.0 408.4',
    strokeDashoffset: '-310.3',
    desk: 'Cabin 4',
    trend: '+6.2% vs last week',
  },
  {
    id: 4,
    range: '0-20',
    name: 'Emergency & Standby',
    share: '12%',
    percent: 12,
    volume: 46,
    avgWait: '2m',
    color: '#EAECF0',
    strokeDasharray: '49.0 408.4',
    strokeDashoffset: '-359.3',
    desk: 'Triage Room',
    trend: 'SLA Benchmark 100%',
  },
];

const RATING_TREND_DATA = [
  { month: 'Jan', x: 60, yourY: 100, yourScore: 78.5, indY: 162, indScore: 62.0, served: 210, sla: '94.2%' },
  { month: 'Feb', x: 121, yourY: 98, yourScore: 79.2, indY: 160, indScore: 62.8, served: 234, sla: '95.1%' },
  { month: 'Mar', x: 182, yourY: 94, yourScore: 81.0, indY: 155, indScore: 64.2, served: 268, sla: '95.8%' },
  { month: 'Apr', x: 243, yourY: 90, yourScore: 82.6, indY: 148, indScore: 66.5, served: 290, sla: '96.2%' },
  { month: 'May', x: 304, yourY: 86, yourScore: 84.0, indY: 140, indScore: 68.4, served: 315, sla: '96.5%' },
  { month: 'Jun', x: 365, yourY: 84, yourScore: 84.8, indY: 138, indScore: 69.1, served: 308, sla: '96.0%' },
  { month: 'Jul', x: 426, yourY: 80, yourScore: 86.5, indY: 134, indScore: 70.0, served: 340, sla: '97.1%' },
  { month: 'Aug', x: 487, yourY: 76, yourScore: 88.0, indY: 130, indScore: 71.2, served: 355, sla: '97.4%' },
  { month: 'Sep', x: 548, yourY: 70, yourScore: 90.2, indY: 126, indScore: 72.3, served: 372, sla: '98.0%' },
  { month: 'Oct', x: 609, yourY: 66, yourScore: 91.8, indY: 120, indScore: 73.8, served: 395, sla: '98.5%' },
  { month: 'Nov', x: 670, yourY: 62, yourScore: 93.4, indY: 114, indScore: 75.1, served: 388, sla: '98.2%' },
  { month: 'Dec', x: 730, yourY: 52, yourScore: 96.0, indY: 106, indScore: 77.0, served: 412, sla: '99.1%' },
];

function AdminOverview() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const facilityId = profile?.facility_id || '00000000-0000-0000-0000-000000000010';

  // Real-time query fetching every 3 seconds
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const { data: analyticsRes, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-analytics', facilityId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: true; data: FacilityAnalytics }>(
        `/analytics/facility/${facilityId}?period=7d`
      );
      setLastSyncTime(new Date());
      return res;
    },
    enabled: !!facilityId,
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });

  const analytics = analyticsRes?.data;

  // Supabase real-time channel subscription for immediate updates
  useEffect(() => {
    try {
      const channel = supabase
        .channel(`admin-overview-${facilityId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'queue_tickets' },
          () => {
            queryClient.invalidateQueries({ queryKey: ['admin-analytics', facilityId] });
            setLastSyncTime(new Date());
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments' },
          () => {
            queryClient.invalidateQueries({ queryKey: ['admin-analytics', facilityId] });
            setLastSyncTime(new Date());
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Offline fallback
    }
  }, [facilityId, queryClient]);

  // Interactive Hover States
  const [hoveredDonutSlice, setHoveredDonutSlice] = useState<number | null>(null);
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(9); // default Oct
  const lineChartSvgRef = useRef<SVGSVGElement | null>(null);

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
                      toast(isEmergencyPaused ? 'Queue session resumed' : 'Emergency pause triggered across all desks');
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
              {/* 1. Header Bar with Real-Time Live Sync Status */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-display-xs sm:text-title-lg font-bold text-ink font-display tracking-tight">
                      Organization overview
                    </h1>
                    {/* Real-time Streaming Status Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-semibold">Live Real-Time Sync</span>
                    </div>
                  </div>
                  <p className="text-caption text-muted mt-0.5">
                    Live operational metrics • Auto-refreshes every 3s • Last synced {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
                  <button
                    onClick={() => {
                      refetch();
                      toast.success('Real-time data refreshed');
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-ink bg-canvas border border-hairline rounded-lg shadow-xs hover:bg-surface-soft hover:border-border transition-colors cursor-pointer"
                    title="Force immediate sync"
                  >
                    <RefreshCw size={14} className={isFetching ? 'animate-spin text-primary' : 'text-muted'} />
                    <span>Sync Now</span>
                  </button>

                  <button
                    onClick={() => toast('Active filters: Last 12 months • All healthcare services • SLA benchmarks')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-ink bg-canvas border border-hairline rounded-lg shadow-xs hover:bg-surface-soft hover:border-border transition-colors cursor-pointer"
                  >
                    <Filter size={16} className="text-muted" />
                    <span>Filters</span>
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold bg-surface-soft text-muted rounded-full border border-hairline">
                      3
                    </span>
                  </button>
                  <button
                    onClick={() => toast('Dashboard customize mode enabled')}
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

              {/* 2. Main Two-Card Grid with Rich Hover Data Visuals */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* ── CARD 1: Service Breakdown (Interactive Donut Chart with Hover Visual) ── */}
                <div className="lg:col-span-5 bg-canvas border border-hairline rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 pb-2">
                      <div>
                        <h2 className="text-base font-bold text-ink">Service breakdown</h2>
                        <p className="text-caption text-muted mt-0.5">5 departments • Real-time patient volume share</p>
                      </div>
                      <button
                        onClick={() => toast('Service breakdown report options')}
                        className="text-muted hover:text-ink p-1 rounded-md hover:bg-surface-soft transition-colors cursor-pointer"
                        aria-label="Options"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    {/* Donut Chart & Legend Body */}
                    <div className="p-6 pt-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6">
                      {/* SVG Donut with Center Data Visual & Hover Expansion */}
                      <div className="relative w-44 h-44 sm:w-48 sm:h-48 shrink-0 flex items-center justify-center">
                        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 transform">
                          {SERVICE_BREAKDOWN_DATA.map((slice) => {
                            const isHovered = hoveredDonutSlice === slice.id;
                            return (
                              <circle
                                key={slice.id}
                                cx="100"
                                cy="100"
                                r="65"
                                fill="transparent"
                                stroke={slice.color}
                                strokeWidth={isHovered ? 38 : 32}
                                strokeDasharray={slice.strokeDasharray}
                                strokeDashoffset={slice.strokeDashoffset}
                                onMouseEnter={() => setHoveredDonutSlice(slice.id)}
                                onMouseLeave={() => setHoveredDonutSlice(null)}
                                className="transition-all duration-200 cursor-pointer"
                                style={{
                                  filter: isHovered ? `drop-shadow(0 0 6px ${slice.color}80)` : 'none',
                                  opacity: hoveredDonutSlice === null || isHovered ? 1 : 0.6,
                                }}
                              />
                            );
                          })}

                          {/* Inner clean cutout */}
                          <circle cx="100" cy="100" r="46" fill="white" />
                        </svg>

                        {/* Center Hover Dynamic Data Visual */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                          {hoveredDonutSlice !== null ? (
                            (() => {
                              const active = SERVICE_BREAKDOWN_DATA[hoveredDonutSlice];
                              return (
                                <div className="animate-in fade-in zoom-in-95 duration-150">
                                  <p className="text-xl sm:text-2xl font-black text-ink leading-tight">
                                    {active.share}
                                  </p>
                                  <p className="text-[10px] font-bold text-muted uppercase tracking-wider truncate max-w-[80px]">
                                    {active.range}
                                  </p>
                                  <p className="text-[10px] font-semibold text-primary">
                                    {active.volume} pts
                                  </p>
                                </div>
                              );
                            })()
                          ) : (
                            <div>
                              <p className="text-xs text-muted uppercase font-bold tracking-wider">Total</p>
                              <p className="text-xl sm:text-2xl font-extrabold text-ink leading-tight">388</p>
                              <p className="text-[10px] text-muted">Patients</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Legend Column with Interactive Hover Highlight */}
                      <div className="flex flex-col gap-2.5 sm:min-w-[130px] w-full sm:w-auto">
                        {SERVICE_BREAKDOWN_DATA.map((item) => {
                          const isHovered = hoveredDonutSlice === item.id;
                          return (
                            <div
                              key={item.id}
                              onMouseEnter={() => setHoveredDonutSlice(item.id)}
                              onMouseLeave={() => setHoveredDonutSlice(null)}
                              className={`flex items-center justify-between sm:justify-start gap-2.5 px-2 py-1 rounded-md transition-all cursor-pointer ${
                                isHovered ? 'bg-surface-soft ring-1 ring-[#7F56D9]/30 scale-[1.02]' : 'hover:bg-surface-soft/60'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/5"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="text-body-sm font-medium text-ink">
                                  {item.range}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-muted ml-auto sm:ml-2">
                                {item.share}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Hover Data Visual Detail Card */}
                    <div className="px-6 pb-2">
                      {hoveredDonutSlice !== null ? (
                        (() => {
                          const active = SERVICE_BREAKDOWN_DATA[hoveredDonutSlice];
                          return (
                            <div className="p-3 bg-surface-soft/70 border border-hairline rounded-xl flex items-center justify-between text-xs animate-in fade-in duration-150">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: active.color }} />
                                <div>
                                  <p className="font-bold text-ink truncate">{active.name}</p>
                                  <p className="text-muted text-[11px]">{active.desk} • {active.avgWait} wait</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-extrabold text-ink">{active.volume} patients</span>
                                <p className="text-[10px] text-emerald-600 font-semibold">{active.trend}</p>
                              </div>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="p-2.5 bg-surface-soft/40 border border-hairline-soft rounded-xl text-center text-caption text-muted">
                          Hover over any slice or category above to inspect patient volume & wait time
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer matching Image 2 */}
                  <div className="p-4 border-t border-hairline flex items-center justify-between">
                    <span className="text-caption text-muted flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live counter throughput
                    </span>
                    <button
                      onClick={() => navigate('/admin/analytics')}
                      className="px-4 py-2 text-sm font-semibold text-ink bg-canvas border border-hairline rounded-lg shadow-xs hover:bg-surface-soft hover:border-border transition-colors cursor-pointer"
                    >
                      View full report
                    </button>
                  </div>
                </div>

                {/* ── CARD 2: Average Service Rating (Dual-Line Trend with Interactive Scrubber & Hover Tooltip) ── */}
                <div className="lg:col-span-7 bg-canvas border border-hairline rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between p-6">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-ink">Average service rating</h2>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            +18.0 vs benchmark
                          </span>
                        </div>
                        <p className="text-caption text-muted mt-0.5">
                          Track how your rating compares to your industry average. Hover any month to inspect exact metrics.
                        </p>
                      </div>
                      <button
                        onClick={() => toast('Trend metric benchmarks: Regional Healthcare SLA')}
                        className="text-muted hover:text-ink p-1 rounded-md hover:bg-surface-soft transition-colors cursor-pointer"
                        aria-label="Options"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    {/* Legend placed top-right below description with active month indicator */}
                    <div className="flex items-center justify-between gap-4 mt-2 mb-3 flex-wrap">
                      <div className="text-xs text-muted">
                        Active Inspection:{' '}
                        <strong className="text-ink">
                          {hoveredMonthIndex !== null ? `${RATING_TREND_DATA[hoveredMonthIndex].month} 2026` : 'Hover to inspect'}
                        </strong>
                      </div>

                      <div className="flex items-center gap-5 text-caption font-medium text-muted">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#7F56D9]" />
                          <span className="text-ink font-semibold">Your rating</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#D6BBFB]" />
                          <span>Industry average</span>
                        </div>
                      </div>
                    </div>

                    {/* Dual Line Curve SVG Chart with Interactive Scrubber */}
                    <div className="w-full overflow-x-auto relative">
                      <div className="min-w-[540px] relative">
                        <svg
                          ref={lineChartSvgRef}
                          viewBox="0 0 760 250"
                          className="w-full h-auto select-none"
                        >
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

                          {/* Fine vertical hatched lines below the curve */}
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

                          {/* ── Interactive Scrubber & Hover Visual Overlay ── */}
                          {hoveredMonthIndex !== null && (() => {
                            const pt = RATING_TREND_DATA[hoveredMonthIndex];
                            return (
                              <g className="transition-all duration-150">
                                {/* Vertical Guideline */}
                                <line
                                  x1={pt.x}
                                  y1={20}
                                  x2={pt.x}
                                  y2={212}
                                  stroke="#7F56D9"
                                  strokeWidth="1.5"
                                  strokeDasharray="4 3"
                                  opacity="0.8"
                                />

                                {/* Industry Avg Glow Dot */}
                                <circle
                                  cx={pt.x}
                                  cy={pt.indY}
                                  r="5"
                                  fill="#D6BBFB"
                                  stroke="#ffffff"
                                  strokeWidth="2"
                                  className="transition-all duration-150"
                                />

                                {/* Your Rating Outer Halo */}
                                <circle
                                  cx={pt.x}
                                  cy={pt.yourY}
                                  r="10"
                                  fill="#7F56D9"
                                  opacity="0.2"
                                />
                                {/* Your Rating Inner Crisp Dot */}
                                <circle
                                  cx={pt.x}
                                  cy={pt.yourY}
                                  r="5.5"
                                  fill="#7F56D9"
                                  stroke="#ffffff"
                                  strokeWidth="2.5"
                                  className="transition-all duration-150"
                                />
                              </g>
                            );
                          })()}

                          {/* X Axis Months & Transparent Interactive Columns */}
                          {RATING_TREND_DATA.map((item, idx) => {
                            const isHovered = hoveredMonthIndex === idx;
                            return (
                              <g key={item.month}>
                                {/* Month Label */}
                                <text
                                  x={item.x}
                                  y="230"
                                  textAnchor="middle"
                                  className={`text-[11px] font-medium transition-colors cursor-pointer ${
                                    isHovered ? 'fill-primary font-bold' : 'fill-muted'
                                  }`}
                                >
                                  {item.month}
                                </text>

                                {/* Transparent hover hit zone covering the column */}
                                <rect
                                  x={item.x - 28}
                                  y="15"
                                  width="56"
                                  height="220"
                                  fill="transparent"
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredMonthIndex(idx)}
                                />
                              </g>
                            );
                          })}

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

                    {/* Floating Hover Data Visual Info Panel */}
                    {hoveredMonthIndex !== null && (() => {
                      const pt = RATING_TREND_DATA[hoveredMonthIndex];
                      const diff = (pt.yourScore - pt.indScore).toFixed(1);
                      return (
                        <div className="mt-3 p-3 bg-surface-soft/80 border border-hairline rounded-xl flex items-center justify-between flex-wrap gap-4 text-xs animate-in fade-in duration-150">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 rounded-md font-bold bg-[#111111] text-white">
                              {pt.month} 2026
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#7F56D9]" />
                              <span>Your Rating: <strong className="text-ink text-sm">{pt.yourScore}</strong>/100</span>
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                                +{diff} pts
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-muted">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#D6BBFB]" />
                              <span>Industry Avg: <strong className="text-ink">{pt.indScore}</strong></span>
                            </div>
                            <span className="text-hairline">|</span>
                            <span>SLA: <strong className="text-ink">{pt.sla}</strong></span>
                            <span className="text-hairline">|</span>
                            <span>Volume: <strong className="text-ink">{pt.served} served</strong></span>
                          </div>
                        </div>
                      );
                    })()}
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
