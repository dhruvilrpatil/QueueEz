import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Clock, Calendar, ArrowRight, Plus, History, Bell, User, CheckCircle,
  AlertCircle, ShieldCheck, Mail, Phone, MapPin, Sparkles, MessageSquare, MessageSquarePlus
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
import { NewQueryModal } from '@/components/messaging/NewQueryModal';
import { messagingApi } from '@/features/messaging/api/messagingApi';

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

  // Customer Query Modal state
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [preloadedContext, setPreloadedContext] = useState<any>(undefined);

  const handleOpenQuery = (context?: any) => {
    setPreloadedContext(context);
    setQueryModalOpen(true);
  };

  const handleQuerySubmit = async (payload: any) => {
    const res = await messagingApi.createConversation(payload);
    navigate(`/app/messages/${res.conversation.id}`);
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
                        <button
                          type="button"
                          onClick={() => handleOpenQuery({
                            appointment: {
                              id: appt.id,
                              booking_reference: appt.booking_reference,
                              date: appt.date,
                              service_name: appt.services?.name,
                            },
                            facility_id: appt.facility_id,
                            facility_name: appt.facilities?.name,
                          })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-hairline hover:bg-surface-soft text-ink transition-colors cursor-pointer"
                          title="Ask staff a question about this appointment"
                        >
                          <MessageSquare size={13} />
                          <span>Ask Staff</span>
                        </button>
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

          {/* Subview: LIVE QUEUE (/app/queue) */}
          {location.pathname === '/app/queue' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-title-md font-semibold text-ink">Virtual Queue Live Tracker</h2>
                  <p className="text-body-sm text-muted">Monitor your real-time position and join walk-in queues nearby.</p>
                </div>
                <Button size="sm" onClick={handleOpenQueue}>
                  <Plus size={14} /> Join New Queue
                </Button>
              </div>

              {currentTicket ? (
                <div className="bg-canvas border border-hairline rounded-2xl p-6 md:p-8 shadow-card space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-hairline gap-4">
                    <div>
                      <span className="text-caption text-muted uppercase tracking-wider font-semibold">Active Ticket</span>
                      <p className="text-display-md font-bold text-ink tracking-tight font-display mt-1">
                        {currentTicket.ticket_number}
                      </p>
                      <p className="text-body-sm text-muted mt-0.5">
                        {currentTicket.services?.name || 'General Medical Consultation'} • {currentTicket.facilities?.name || 'Metro General Hospital'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <TicketStatusBadge status={currentTicket.status} />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/app/queue/${currentTicket.id}`)}
                      >
                        View Ticket QR <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* 4-Step Progress Tracker */}
                  <div className="py-2">
                    <p className="text-caption font-semibold text-muted mb-4 uppercase tracking-wider">Queue Progress</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <CheckCircle size={14} /> 1. Ticket Issued
                        </div>
                        <p className="text-[11px] text-emerald-600">Reserved in session</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                          <Clock size={14} className="animate-spin" /> 2. Waiting in Line
                        </div>
                        <p className="text-[11px] text-muted">{currentTicket.people_ahead} people ahead</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface-soft border border-hairline space-y-1 opacity-70">
                        <div className="text-xs font-semibold text-ink">3. Call to Desk</div>
                        <p className="text-[11px] text-muted">Desk #{currentTicket.counters?.number || 1}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface-soft border border-hairline space-y-1 opacity-70">
                        <div className="text-xs font-semibold text-ink">4. Service Complete</div>
                        <p className="text-[11px] text-muted">Consultation done</p>
                      </div>
                    </div>
                  </div>

                  {/* Live Stats Row */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-hairline text-center">
                    <div className="bg-surface-soft rounded-xl p-4">
                      <p className="text-display-xs font-bold text-ink">{currentTicket.people_ahead}</p>
                      <p className="text-caption text-muted mt-0.5">Patients Ahead</p>
                    </div>
                    <div className="bg-surface-soft rounded-xl p-4">
                      <p className="text-display-xs font-bold text-ink">~{currentTicket.estimated_wait_minutes}m</p>
                      <p className="text-caption text-muted mt-0.5">Estimated Wait</p>
                    </div>
                    <div className="bg-surface-soft rounded-xl p-4">
                      <p className="text-body-sm font-bold text-ink mt-1">{currentTicket.counters?.name || 'Counter 1'}</p>
                      <p className="text-caption text-muted mt-0.5">Assigned Desk</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-canvas border border-hairline rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto shadow-2xs">
                    <div className="w-14 h-14 rounded-2xl bg-surface-card flex items-center justify-center mx-auto text-muted">
                      <Clock size={24} />
                    </div>
                    <h3 className="text-title-md font-semibold text-ink">You are not currently in any queue</h3>
                    <p className="text-body-sm text-muted">
                      Select a facility below to join a walk-in queue, or schedule an appointment for later.
                    </p>
                    <Button onClick={handleOpenQueue} size="lg" icon={<Plus size={16} />}>
                      Join a Virtual Queue
                    </Button>
                  </div>

                  {/* Available facilities accepting live queues */}
                  <div>
                    <h3 className="text-title-sm font-semibold text-ink mb-3">Live Walk-in Facilities Near You</h3>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { name: 'Metro General Hospital', dept: 'Outpatient & Triage', wait: '12 mins', waiting: 3, open: true },
                        { name: 'City Central Polyclinic', dept: 'General Medicine', wait: '5 mins', waiting: 1, open: true },
                        { name: 'St. Jude Specialist Center', dept: 'Cardiology Desk', wait: '25 mins', waiting: 6, open: true },
                      ].map((fac) => (
                        <div key={fac.name} className="bg-canvas border border-hairline rounded-xl p-5 shadow-2xs space-y-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Queue Open
                              </span>
                              <span className="text-caption text-muted font-medium">~{fac.wait}</span>
                            </div>
                            <h4 className="text-body-sm font-bold text-ink">{fac.name}</h4>
                            <p className="text-caption text-muted mt-0.5">{fac.dept}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full"
                            onClick={handleOpenQueue}
                          >
                            Join Line ({fac.waiting} waiting)
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subview 5: DASHBOARD VIEW (/app/dashboard, /app) */}
          {(location.pathname === '/app/dashboard' || location.pathname === '/app') && (
            <>
              {/* Quick actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

                <button
                  type="button"
                  onClick={() => handleOpenQuery()}
                  className="flex items-center justify-between bg-canvas border border-hairline rounded-xl p-6 hover:bg-surface-soft transition-colors text-left cursor-pointer shadow-xs"
                >
                  <div>
                    <p className="text-body-sm font-semibold text-ink mb-1">Ask a Question</p>
                    <p className="text-caption text-muted">Direct staff & facility chat</p>
                  </div>
                  <div className="w-10 h-10 bg-surface-card rounded-lg flex items-center justify-center text-muted">
                    <MessageSquarePlus size={20} />
                  </div>
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 items-stretch">
                {/* Current Queue Ticket */}
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between h-9 mb-3">
                    <h2 className="text-title-sm font-semibold text-ink">Current Queue</h2>
                  </div>
                  {ticketLoading ? (
                    <div className="bg-canvas border border-hairline rounded-xl p-6 space-y-4 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-32" />
                      <div className="grid grid-cols-3 gap-3">
                        <Skeleton className="h-16 rounded-lg" />
                        <Skeleton className="h-16 rounded-lg" />
                        <Skeleton className="h-16 rounded-lg" />
                      </div>
                    </div>
                  ) : currentTicket ? (
                    <div className="bg-canvas border border-hairline rounded-xl p-6 flex-1 flex flex-col justify-between">
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
                    <div className="bg-canvas border border-hairline rounded-xl p-6 flex-1 flex flex-col justify-center min-h-[340px]">
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
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between h-9 mb-3">
                    <h2 className="text-title-sm font-semibold text-ink">Upcoming Appointments</h2>
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
                    <div className="space-y-3 flex-1">
                      <AppointmentItemSkeleton />
                      <AppointmentItemSkeleton />
                    </div>
                  ) : upcomingAppointments.length > 0 ? (
                    <div className="space-y-3 flex-1">
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
                    <div className="bg-canvas border border-hairline rounded-xl p-6 flex-1 flex flex-col justify-center min-h-[340px]">
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

      {/* ── CUSTOMER QUERY MODAL (Contextual Messaging Subsystem) ── */}
      <NewQueryModal
        isOpen={queryModalOpen}
        onClose={() => setQueryModalOpen(false)}
        onSubmit={handleQuerySubmit}
        preloadedContext={preloadedContext}
      />
    </AppLayout>
  );
}

export default CustomerDashboard;
