import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Clock, Calendar, ArrowRight, Plus, History, Bell, User, CheckCircle,
  AlertCircle, ShieldCheck, Mail, Phone, MapPin, Sparkles
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppSidebar';
import { StatCard, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TicketStatusBadge, AppointmentStatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';
import type { QueueTicket, Appointment } from '@/types';
import { format } from 'date-fns';
import {
  Skeleton,
  StatsRowSkeleton,
  AppointmentItemSkeleton,
  QueueItemSkeleton
} from '@/components/ui/Skeleton';
import { CustomerBookingWizard, WizardMode } from '@/components/customer/CustomerBookingWizard';

function CustomerDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: appointments, isLoading: apptLoading } = useQuery({
    queryKey: ['appointments', 'upcoming'],
    queryFn: () => apiClient.get<{ success: true; data: Appointment[] }>('/appointments'),
  });

  const { data: activeTicket, isLoading: ticketLoading } = useQuery({
    queryKey: ['active-ticket'],
    queryFn: () => apiClient.get<{ success: true; data: QueueTicket[] }>('/queues/tickets/active'),
    refetchInterval: 30000,
  });

  const allAppointments = appointments?.data || [];
  const upcomingAppointments = allAppointments
    .filter((a) => ['scheduled', 'confirmed'].includes(a.status));
  const pastAppointments = allAppointments
    .filter((a) => ['completed', 'cancelled', 'no_show'].includes(a.status));

  const currentTicket = activeTicket?.data?.[0];

  const isInitialLoading = apptLoading && ticketLoading;

  // Wizard state for multi-step Join Queue and Book Appointment
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<WizardMode>('queue');

  const handleOpenQueue = () => {
    setWizardMode('queue');
    setWizardOpen(true);
  };

  const handleOpenAppointment = () => {
    setWizardMode('appointment');
    setWizardOpen(true);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppLayout role="customer">
      {/* Dynamic Header */}
      <div className="mb-8">
        <h1 className="text-display-sm font-semibold text-ink">
          {location.pathname === '/app/appointments'
            ? 'My Appointments'
            : location.pathname === '/app/history'
            ? 'Activity History'
            : location.pathname === '/app/notifications'
            ? 'Notifications Center'
            : location.pathname === '/app/profile'
            ? 'Profile & Preferences'
            : location.pathname === '/app/queue'
            ? 'Virtual Queue Status'
            : `${greeting()}, ${profile?.full_name?.split(' ')[0] || 'there'} 👋`}
        </h1>
        <p className="text-body-sm text-muted mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* FULL SKELETON SCREEN LOADING */}
      {isInitialLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="bg-canvas border border-hairline rounded-xl p-6 space-y-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-36" />
                <div className="grid grid-cols-3 gap-3">
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                  <Skeleton className="h-16 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-5 w-44" />
              <AppointmentItemSkeleton />
              <AppointmentItemSkeleton />
            </div>
          </div>
          <StatsRowSkeleton count={4} />
        </div>
      ) : (
        <>
          {/* Subview 1: APPOINTMENTS (/app/appointments) */}
          {location.pathname === '/app/appointments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-body-sm text-muted">Manage your upcoming and past facility appointments.</p>
                <Button size="sm" onClick={handleOpenAppointment}>
                  <Plus size={14} /> Book New Appointment
                </Button>
              </div>

              {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  <h2 className="text-title-sm text-ink">Upcoming ({upcomingAppointments.length})</h2>
                  {upcomingAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="bg-canvas border border-hairline rounded-xl p-5 hover:border-ink/20 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-body-sm font-bold text-ink">{appt.services?.name || 'Medical Service'}</p>
                          <AppointmentStatusBadge status={appt.status} />
                        </div>
                        <p className="text-caption text-muted flex items-center gap-2">
                          <MapPin size={12} /> {appt.facilities?.name || 'Metro General Hospital'}
                        </p>
                        <p className="text-caption text-muted flex items-center gap-2">
                          <Calendar size={12} /> {format(new Date(appt.date), 'EEEE, MMMM d, yyyy')} • {appt.start_time}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-caption text-muted bg-surface-soft px-2.5 py-1 rounded-md border border-hairline">
                          {appt.booking_reference}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Calendar size={20} />}
                  title="No upcoming appointments"
                  description="Schedule an appointment at any participating hospital or service center."
                  action={
                    <Button size="sm" onClick={handleOpenAppointment}>
                      <Plus size={14} /> Book Appointment
                    </Button>
                  }
                />
              )}
            </div>
          )}

          {/* Subview 2: HISTORY (/app/history) */}
          {location.pathname === '/app/history' && (
            <div className="space-y-6">
              <p className="text-body-sm text-muted">Review your completed visits and previous queue tokens.</p>
              {pastAppointments.length > 0 ? (
                <div className="space-y-3">
                  {pastAppointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="bg-canvas border border-hairline rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-body-sm font-semibold text-ink">{appt.services?.name || 'Consultation'}</span>
                          <AppointmentStatusBadge status={appt.status} />
                        </div>
                        <p className="text-caption text-muted mt-0.5">{appt.facilities?.name || 'Clinic'} • Ref: {appt.booking_reference}</p>
                      </div>
                      <span className="text-caption text-muted">{format(new Date(appt.date), 'MMM d, yyyy')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<History size={20} />}
                  title="No past history records"
                  description="Your completed appointments and served queue tokens will show here."
                />
              )}
            </div>
          )}

          {/* Subview 3: NOTIFICATIONS (/app/notifications) */}
          {location.pathname === '/app/notifications' && (
            <div className="space-y-4 max-w-2xl">
              <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-hairline pb-4">
                  <h3 className="text-title-sm font-semibold text-ink">Notifications & Reminders</h3>
                  <span className="text-caption text-muted">3 new updates</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3.5 rounded-lg bg-surface-soft border border-hairline space-y-1">
                    <p className="text-body-sm font-semibold text-ink">Appointment Confirmed</p>
                    <p className="text-caption text-muted">Your General Consultation booking for tomorrow at 10:00 AM is confirmed.</p>
                    <span className="text-[11px] text-muted">2 hours ago</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-surface-soft border border-hairline space-y-1">
                    <p className="text-body-sm font-semibold text-ink">Queue Position Update</p>
                    <p className="text-caption text-muted">Only 2 people ahead of you in line. Please head towards Counter 1.</p>
                    <span className="text-[11px] text-muted">Yesterday</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-surface-soft border border-hairline space-y-1">
                    <p className="text-body-sm font-semibold text-ink">Welcome to QueueEz</p>
                    <p className="text-caption text-muted">Your patient account has been verified. You can now join virtual queues anytime.</p>
                    <span className="text-[11px] text-muted">3 days ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subview 4: PROFILE (/app/profile) */}
          {location.pathname === '/app/profile' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-canvas border border-hairline rounded-xl p-6 shadow-2xs space-y-4">
                <h3 className="text-title-sm font-semibold text-ink border-b border-hairline pb-3">
                  Customer Profile
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-caption font-semibold text-muted block mb-1">Full Name</label>
                    <p className="text-ink font-medium">{profile?.full_name || 'Customer'}</p>
                  </div>
                  <div className="pt-2 border-t border-hairline">
                    <label className="text-caption font-semibold text-muted block mb-1">Email Address</label>
                    <p className="text-ink font-medium">{profile?.email || 'customer@demo.com'}</p>
                  </div>
                  <div className="pt-2 border-t border-hairline">
                    <label className="text-caption font-semibold text-muted block mb-1">Phone Number</label>
                    <p className="text-ink font-medium">{profile?.phone || '+91-9876543210'}</p>
                  </div>
                  <div className="pt-2 border-t border-hairline">
                    <label className="text-caption font-semibold text-muted block mb-1">Account Role</label>
                    <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                      {profile?.role || 'Customer'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subview 5: DASHBOARD & QUEUE VIEW (/app/dashboard, /app/queue, /app) */}
          {(location.pathname === '/app/dashboard' ||
            location.pathname === '/app/queue' ||
            location.pathname === '/app') && (
            <>
              {/* Quick actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <button
                  type="button"
                  onClick={handleOpenQueue}
                  className="flex items-center justify-between bg-primary text-on-primary rounded-xl p-6 hover:bg-primary-active transition-colors text-left cursor-pointer shadow-xs"
                >
                  <div>
                    <p className="text-body-sm font-semibold mb-1">Join a Queue</p>
                    <p className="text-caption opacity-70">Walk-in virtual queue</p>
                  </div>
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAppointment}
                  className="flex items-center justify-between bg-canvas border border-hairline rounded-xl p-6 hover:bg-surface-soft transition-colors text-left cursor-pointer shadow-xs"
                >
                  <div>
                    <p className="text-body-sm font-semibold text-ink mb-1">Book Appointment</p>
                    <p className="text-caption text-muted">Schedule for a specific time</p>
                  </div>
                  <div className="w-10 h-10 bg-surface-card rounded-lg flex items-center justify-center text-muted">
                    <Calendar size={20} />
                  </div>
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Current Queue Ticket */}
                <div>
                  <h2 className="text-title-sm text-ink mb-3">Current Queue</h2>
                  {ticketLoading ? (
                    <div className="bg-canvas border border-hairline rounded-xl p-6 space-y-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-32" />
                      <div className="grid grid-cols-3 gap-3">
                        <Skeleton className="h-16 rounded-lg" />
                        <Skeleton className="h-16 rounded-lg" />
                        <Skeleton className="h-16 rounded-lg" />
                      </div>
                    </div>
                  ) : currentTicket ? (
                    <div className="bg-canvas border border-hairline rounded-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-caption text-muted">Your ticket</p>
                          <p className="text-display-md font-semibold text-ink tracking-tight font-display">
                            {currentTicket.ticket_number}
                          </p>
                        </div>
                        <TicketStatusBadge status={currentTicket.status} />
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-surface-soft rounded-lg p-3 text-center">
                          <p className="text-title-sm font-semibold text-ink">{currentTicket.people_ahead}</p>
                          <p className="text-caption text-muted">Ahead</p>
                        </div>
                        <div className="bg-surface-soft rounded-lg p-3 text-center">
                          <p className="text-title-sm font-semibold text-ink">
                            ~{currentTicket.estimated_wait_minutes}m
                          </p>
                          <p className="text-caption text-muted">Wait</p>
                        </div>
                        <div className="bg-surface-soft rounded-lg p-3 text-center">
                          <p className="text-caption font-semibold text-ink">
                            {currentTicket.counters?.name || 'Counter 1'}
                          </p>
                          <p className="text-caption text-muted">Counter</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-caption text-muted">
                          <span className="live-dot" />
                          Live Status
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/app/queue/${currentTicket.id}`)}
                        >
                          View details
                          <ArrowRight size={14} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-canvas border border-hairline rounded-xl p-6">
                      <EmptyState
                        icon={<Clock size={20} />}
                        title="No active queue ticket"
                        description="Join a virtual queue to track your position in line."
                        action={
                          <Button size="sm" onClick={handleOpenQueue}>
                            <Plus size={14} /> Join Queue
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Upcoming Appointments */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-title-sm text-ink">Upcoming Appointments</h2>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate('/app/appointments')}
                      iconRight={<ArrowRight size={12} />}
                    >
                      View all
                    </Button>
                  </div>

                  {apptLoading ? (
                    <div className="space-y-3">
                      <AppointmentItemSkeleton />
                      <AppointmentItemSkeleton />
                    </div>
                  ) : upcomingAppointments.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingAppointments.slice(0, 3).map((appt) => (
                        <div
                          key={appt.id}
                          className="bg-canvas border border-hairline rounded-xl p-4 cursor-pointer hover:border-ink/20 transition-colors"
                          onClick={() => navigate('/app/appointments')}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-body-sm font-semibold text-ink">
                                {appt.services?.name || 'Service'}
                              </p>
                              <p className="text-caption text-muted">
                                {appt.facilities?.name || 'Metro General Hospital'}
                              </p>
                            </div>
                            <AppointmentStatusBadge status={appt.status} />
                          </div>
                          <div className="flex items-center gap-4 text-caption text-muted">
                            <span>{format(new Date(appt.date), 'MMM d, yyyy')}</span>
                            <span>{appt.start_time}</span>
                            <span className="font-mono">{appt.booking_reference}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-canvas border border-hairline rounded-xl p-6">
                      <EmptyState
                        icon={<Calendar size={20} />}
                        title="No upcoming appointments"
                        description="Book an appointment at your preferred facility."
                        action={
                          <Button size="sm" onClick={handleOpenAppointment}>
                            <Plus size={14} /> Book appointment
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <StatCard label="Total Appointments" value={allAppointments.length || 1} icon={<Calendar size={16} />} />
                <StatCard label="Completed" value={pastAppointments.length || 1} icon={<History size={16} />} />
                <StatCard label="Upcoming" value={upcomingAppointments.length} icon={<Clock size={16} />} />
                <StatCard label="Active Tickets" value={currentTicket ? 1 : 0} icon={<ArrowRight size={16} />} />
              </div>
            </>
          )}
        </>
      )}

      {/* ── PROGRESS STEP WIZARD MODAL (Join Queue & Book Appointment) ── */}
      <CustomerBookingWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        initialMode={wizardMode}
      />
    </AppLayout>
  );
}

export default CustomerDashboard;
