import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, Calendar, ArrowRight, Plus, History } from 'lucide-react';
import { AppLayout, PageHeader } from '@/components/layout/AppSidebar';
import { StatCard, EmptyState, SkeletonCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TicketStatusBadge, AppointmentStatusBadge } from '@/components/ui/Badge';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';
import type { QueueTicket, Appointment } from '@/types';
import { format } from 'date-fns';

function CustomerDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: appointments, isLoading: apptLoading } = useQuery({
    queryKey: ['appointments', 'upcoming'],
    queryFn: () => apiClient.get<{ success: true; data: Appointment[] }>('/appointments'),
  });

  const { data: activeTicket, isLoading: ticketLoading } = useQuery({
    queryKey: ['active-ticket'],
    queryFn: () => apiClient.get<{ success: true; data: QueueTicket[] }>('/queues/tickets/active'),
    refetchInterval: 30000, // Poll every 30s
  });

  const upcomingAppointments = (appointments?.data || [])
    .filter((a) => ['scheduled', 'confirmed'].includes(a.status))
    .slice(0, 3);

  const currentTicket = activeTicket?.data?.[0];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppLayout role="customer">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-display-sm font-semibold text-ink">
          {greeting()}, {profile?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-body-sm text-muted mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => navigate('/facilities')}
          className="flex items-center justify-between bg-primary text-on-primary rounded-xl p-6 hover:bg-primary-active transition-colors text-left"
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
          onClick={() => navigate('/facilities')}
          className="flex items-center justify-between bg-canvas border border-hairline rounded-xl p-6 hover:bg-surface-soft transition-colors text-left"
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
            <SkeletonCard />
          ) : currentTicket ? (
            <div className="bg-canvas border border-hairline rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-caption text-muted">Your ticket</p>
                  <p className="text-display-md font-semibold text-ink tracking-tight">
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
                    {currentTicket.counters?.name || 'TBD'}
                  </p>
                  <p className="text-caption text-muted">Counter</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-caption text-muted">
                  <span className="live-dot" />
                  Live
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
                title="No active queue"
                description="Join a virtual queue to track your position here."
                action={
                  <Button size="sm" onClick={() => navigate('/facilities')}>
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
            <SkeletonCard />
          ) : upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-canvas border border-hairline rounded-xl p-4 cursor-pointer hover:border-ink/20 transition-colors"
                  onClick={() => navigate(`/app/appointments/${appt.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-body-sm font-semibold text-ink">
                        {appt.services?.name || 'Service'}
                      </p>
                      <p className="text-caption text-muted">
                        {appt.facilities?.name || 'Facility'}
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
                  <Button size="sm" onClick={() => navigate('/facilities')}>
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
        <StatCard label="Total Appointments" value={appointments?.data?.length || 0} icon={<Calendar size={16} />} />
        <StatCard label="Completed" value={appointments?.data?.filter(a => a.status === 'completed').length || 0} icon={<History size={16} />} />
        <StatCard label="Upcoming" value={upcomingAppointments.length} icon={<Clock size={16} />} />
        <StatCard label="Cancelled" value={appointments?.data?.filter(a => a.status === 'cancelled').length || 0} icon={<ArrowRight size={16} />} />
      </div>
    </AppLayout>
  );
}

export default CustomerDashboard;
