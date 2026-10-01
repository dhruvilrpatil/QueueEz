import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { AppLayout, PageHeader } from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/Button';
import { StatCard, EmptyState, SkeletonCard } from '@/components/ui/Card';
import { TicketStatusBadge, PriorityBadge, CounterStatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';
import type { QueueTicket, QueueStats } from '@/types';
import toast from 'react-hot-toast';
import {
  Phone, RotateCcw, SkipForward, Play, CheckCircle, UserX, ArrowRight,
  Clock, Users, CheckSquare, BarChart2
} from 'lucide-react';

interface StaffState {
  counterId: string | null;
  facilityId: string | null;
  sessionId: string | null;
  currentTicketId: string | null;
}

function StaffQueueDashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<StaffState>({
    counterId: null,
    facilityId: profile?.facility_id || null,
    sessionId: null,
    currentTicketId: null,
  });
  const [confirmAction, setConfirmAction] = useState<{
    action: string;
    ticketId: string;
    label: string;
  } | null>(null);

  // Get today's queue session
  const { data: sessionRes } = useQuery({
    queryKey: ['staff-session', state.facilityId],
    queryFn: () =>
      apiClient.get<{ success: true; data: { id: string } }>(
        `/queues/sessions/today?facility_id=${state.facilityId}`
      ),
    enabled: !!state.facilityId,
  });

  const sessionId = sessionRes?.data?.id;

  // Get queue tickets
  const { data: ticketsRes, isLoading } = useQuery({
    queryKey: ['staff-tickets', sessionId],
    queryFn: () =>
      apiClient.get<{ success: true; data: QueueTicket[] }>(
        `/queues/${sessionId}/tickets`
      ),
    enabled: !!sessionId,
    refetchInterval: 15000,
  });

  // Get queue stats
  const { data: statsRes } = useQuery({
    queryKey: ['staff-stats', sessionId],
    queryFn: () =>
      apiClient.get<{ success: true; data: QueueStats }>(
        `/queues/${sessionId}/stats`
      ),
    enabled: !!sessionId,
    refetchInterval: 30000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_tickets',
          filter: `queue_session_id=eq.${sessionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['staff-tickets', sessionId] });
          queryClient.invalidateQueries({ queryKey: ['staff-stats', sessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  const tickets = ticketsRes?.data || [];
  const stats = statsRes?.data;
  const waitingTickets = tickets.filter((t) => t.status === 'waiting');
  const currentTicket = tickets.find((t) => t.status === 'in_service' || t.status === 'called');

  // Mutation for ticket operations
  const ticketMutation = useMutation({
    mutationFn: ({ action, ticketId, body }: { action: string; ticketId: string; body?: unknown }) =>
      apiClient.post(`/queues/tickets/${ticketId}/${action}`, body || {}),
    onSuccess: (_, variables) => {
      const messages: Record<string, string> = {
        call: 'Ticket called',
        recall: 'Ticket recalled',
        start: 'Service started',
        complete: 'Service completed',
        skip: 'Ticket skipped',
        'no-show': 'Marked as no-show',
      };
      toast.success(messages[variables.action] || 'Done');
      queryClient.invalidateQueries({ queryKey: ['staff-tickets', sessionId] });
      setConfirmAction(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Operation failed');
    },
  });

  const handleAction = (action: string, ticketId: string, requiresConfirm = false, label = '') => {
    if (requiresConfirm) {
      setConfirmAction({ action, ticketId, label });
      return;
    }
    ticketMutation.mutate({
      action,
      ticketId,
      body: state.counterId ? { counter_id: state.counterId } : {},
    });
  };

  return (
    <AppLayout role="staff">
      <PageHeader
        title="Queue Dashboard"
        description={`${profile?.full_name} • ${state.facilityId ? 'Active' : 'No facility assigned'}`}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Waiting" value={stats?.waiting || 0} icon={<Clock size={16} />} />
        <StatCard label="In Service" value={stats?.in_service || 0} icon={<Users size={16} />} />
        <StatCard label="Completed" value={stats?.completed || 0} icon={<CheckSquare size={16} />} />
        <StatCard
          label="Avg. Service"
          value={`${stats?.avg_service_time_minutes || 0}m`}
          icon={<BarChart2 size={16} />}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current ticket */}
        <div className="lg:col-span-1">
          <h2 className="text-title-sm text-ink mb-3">Currently Serving</h2>
          {currentTicket ? (
            <div className="bg-canvas border-2 border-primary rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-caption text-muted">Ticket</p>
                  <p className="text-4xl font-semibold text-ink tracking-tight">
                    {currentTicket.ticket_number}
                  </p>
                </div>
                <TicketStatusBadge status={currentTicket.status} />
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-muted">Service</span>
                  <span className="font-medium text-ink">{currentTicket.services?.name}</span>
                </div>
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-muted">Priority</span>
                  <PriorityBadge priority={currentTicket.priority} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                {currentTicket.status === 'called' && (
                  <Button
                    className="w-full"
                    icon={<Play size={14} />}
                    onClick={() => handleAction('start', currentTicket.id)}
                    isLoading={ticketMutation.isPending}
                  >
                    Start Service
                  </Button>
                )}
                {currentTicket.status === 'in_service' && (
                  <Button
                    className="w-full"
                    icon={<CheckCircle size={14} />}
                    onClick={() => handleAction('complete', currentTicket.id, true, 'Complete service')}
                    isLoading={ticketMutation.isPending}
                  >
                    Complete Service
                  </Button>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RotateCcw size={12} />}
                    onClick={() => handleAction('recall', currentTicket.id)}
                  >
                    Recall
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<SkipForward size={12} />}
                    onClick={() => handleAction('skip', currentTicket.id, true, 'Skip ticket')}
                  >
                    Skip
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<UserX size={12} />}
                    onClick={() => handleAction('no-show', currentTicket.id, true, 'Mark no-show')}
                  >
                    No-show
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-canvas border border-hairline rounded-xl p-6 text-center">
              <p className="text-body-sm text-muted mb-4">No active ticket</p>
              {waitingTickets.length > 0 && (
                <Button
                  icon={<Phone size={14} />}
                  onClick={() =>
                    handleAction('call', waitingTickets[0].id, false, 'Call next')
                  }
                  isLoading={ticketMutation.isPending}
                >
                  Call Next
                </Button>
              )}
            </div>
          )}

          {/* Call next */}
          {!currentTicket && waitingTickets.length === 0 && (
            <div className="mt-4 text-center text-body-sm text-muted">
              Queue is empty
            </div>
          )}
        </div>

        {/* Waiting queue */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-title-sm text-ink">
              Waiting Queue ({waitingTickets.length})
            </h2>
            {!currentTicket && waitingTickets.length > 0 && (
              <Button
                size="sm"
                icon={<Phone size={14} />}
                onClick={() => handleAction('call', waitingTickets[0].id)}
                isLoading={ticketMutation.isPending}
              >
                Call Next
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : waitingTickets.length > 0 ? (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {waitingTickets.map((ticket, i) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between bg-canvas border border-hairline rounded-xl p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-surface-card rounded-lg flex items-center justify-center text-caption font-semibold text-muted">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-body-sm font-semibold text-ink">
                        {ticket.ticket_number}
                      </p>
                      <p className="text-caption text-muted">{ticket.services?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <PriorityBadge priority={ticket.priority} />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAction('call', ticket.id)}
                    >
                      Call
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Clock size={20} />}
              title="Queue is empty"
              description="No customers are waiting right now."
            />
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() =>
          confirmAction &&
          ticketMutation.mutate({ action: confirmAction.action, ticketId: confirmAction.ticketId })
        }
        title={confirmAction?.label || 'Confirm action'}
        description="Are you sure you want to perform this action?"
        isDanger={['skip', 'no-show'].includes(confirmAction?.action || '')}
        isLoading={ticketMutation.isPending}
      />
    </AppLayout>
  );
}

export default StaffQueueDashboard;
