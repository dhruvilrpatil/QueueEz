import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, MapPin, AlertCircle, X, RefreshCw, MessageSquare, CheckCircle2 } from 'lucide-react';
import { AppLayout, PageHeader } from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/Button';
import { TicketStatusBadge } from '@/components/ui/Badge';
import { SkeletonCard, ErrorState } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';
import type { QueueTicket } from '@/types';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { NewQueryModal } from '@/components/messaging/NewQueryModal';
import { messagingApi } from '@/features/messaging/api/messagingApi';

function QueueTicketPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [queryModalOpen, setQueryModalOpen] = useState(false);

  const handleQuerySubmit = async (payload: any) => {
    const res = await messagingApi.createConversation(payload);
    navigate(`/app/messages/${res.conversation.id}`);
  };

  const {
    data: ticketRes,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () =>
      apiClient.get<{ success: true; data: QueueTicket }>(`/queues/tickets/${ticketId}`),
    refetchInterval: 60000, // Refetch every minute as fallback
    enabled: !!ticketId,
  });

  const ticket = ticketRes?.data;

  // Realtime subscription
  useEffect(() => {
    if (!ticketId) return;

    const channel = supabase
      .channel(`ticket:${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'queue_tickets',
          filter: `id=eq.${ticketId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  const cancelMutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`/queues/tickets/${ticketId}/cancel`),
    onSuccess: () => {
      toast.success('Queue ticket cancelled');
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      setCancelOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to cancel');
    },
  });

  if (isLoading) {
    return (
      <AppLayout role="customer">
        <PageHeader title="Queue Status" description="Loading real-time queue position..." />
        <div className="max-w-xl mx-auto space-y-4">
          <div className="bg-canvas border border-hairline rounded-xl p-8 text-center space-y-4">
            <div className="skeleton h-4 w-24 mx-auto" />
            <div className="skeleton h-16 w-44 mx-auto" />
            <div className="skeleton h-6 w-20 rounded-full mx-auto" />
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="skeleton h-20 rounded-xl" />
              <div className="skeleton h-20 rounded-xl" />
              <div className="skeleton h-20 rounded-xl" />
            </div>
          </div>
          <div className="bg-canvas border border-hairline rounded-xl p-6 space-y-3">
            <div className="skeleton h-5 w-20" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (isError || !ticket) {
    return (
      <AppLayout role="customer">
        <PageHeader title="Queue Status" />
        <ErrorState
          title="Failed to load ticket"
          message="The ticket could not be found or you don't have access."
          retry={refetch}
        />
      </AppLayout>
    );
  }

  const isActive = ['waiting', 'called', 'checked_in'].includes(ticket.status);
  const isCalled = ticket.status === 'called';
  const isInService = ticket.status === 'in_service';
  const isCompleted = ticket.status === 'completed';

  return (
    <AppLayout role="customer">
      <PageHeader
        title="Queue Status"
        description="Track your position in real-time"
        action={
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        }
      />

      <div className="max-w-xl mx-auto space-y-4">
        {/* Called banner */}
        {isCalled && (
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle size={18} className="text-warning shrink-0" />
            <div>
              <p className="text-body-sm font-semibold text-warning">You're being called!</p>
              <p className="text-caption text-warning/80">
                Please proceed to {ticket.counters?.name || 'the counter'} now.
              </p>
            </div>
          </div>
        )}

        {/* Completed banner */}
        {isCompleted && (
          <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-center">
            <p className="text-body-sm font-semibold text-success mb-1 flex items-center justify-center gap-1.5">
              <CheckCircle2 size={16} />
              <span>Service completed!</span>
            </p>
            <p className="text-caption text-success/80">Thank you for using EzQueue.</p>
          </div>
        )}

        {/* Main ticket card */}
        <div className="bg-canvas border border-hairline rounded-xl p-8 text-center">
          <p className="text-caption text-muted mb-2">Your Ticket</p>
          <p className="text-6xl font-semibold text-ink tracking-tight mb-4">
            {ticket.ticket_number}
          </p>
          <TicketStatusBadge status={ticket.status} />

          {isActive && (
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-surface-soft rounded-xl p-4">
                <p className="text-display-sm font-semibold text-ink">{ticket.people_ahead}</p>
                <p className="text-caption text-muted mt-1">People ahead</p>
              </div>
              <div className="bg-surface-soft rounded-xl p-4">
                <p className="text-display-sm font-semibold text-ink">
                  ~{ticket.estimated_wait_minutes}m
                </p>
                <p className="text-caption text-muted mt-1">Est. wait</p>
              </div>
              <div className="bg-surface-soft rounded-xl p-4">
                <p className="text-title-sm font-semibold text-ink">
                  {ticket.counters?.name || '—'}
                </p>
                <p className="text-caption text-muted mt-1">Counter</p>
              </div>
            </div>
          )}
        </div>

        {/* Details card */}
        <div className="bg-canvas border border-hairline rounded-xl p-6 space-y-3">
          <h3 className="text-title-sm text-ink">Details</h3>
          {[
            { label: 'Service', value: ticket.services?.name },
            { label: 'Facility', value: ticket.facilities?.name },
            { label: 'Priority', value: ticket.priority },
            { label: 'Joined at', value: formatDistanceToNow(new Date(ticket.joined_at), { addSuffix: true }) },
            ticket.called_at && { label: 'Called at', value: formatDistanceToNow(new Date(ticket.called_at), { addSuffix: true }) },
            ticket.completed_at && { label: 'Completed at', value: formatDistanceToNow(new Date(ticket.completed_at), { addSuffix: true }) },
          ]
            .filter(Boolean)
            .map((row) => row && (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-body-sm text-muted">{row.label}</span>
                <span className="text-body-sm font-medium text-ink capitalize">{row.value}</span>
              </div>
            ))}
        </div>

        {/* Live indicator */}
        {isActive && (
          <div className="flex items-center justify-center gap-2 text-caption text-muted">
            <span className="live-dot" />
            Live updates active
          </div>
        )}

        {/* Actions */}
        {isActive && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setQueryModalOpen(true)}
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-canvas border border-hairline text-ink text-xs font-semibold hover:bg-surface-soft transition-colors cursor-pointer"
            >
              <MessageSquare size={14} />
              <span>Ask Staff About This Token</span>
            </button>

            <Button
              variant="secondary"
              className="w-full"
              icon={<X size={14} />}
              onClick={() => setCancelOpen(true)}
            >
              Cancel queue
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel queue ticket?"
        description="You'll lose your position and will need to rejoin if you change your mind."
        confirmLabel="Yes, cancel"
        cancelLabel="Keep my spot"
        isDanger
        isLoading={cancelMutation.isPending}
      />

      {/* New Query Modal with pre-loaded queue context */}
      <NewQueryModal
        isOpen={queryModalOpen}
        onClose={() => setQueryModalOpen(false)}
        onSubmit={handleQuerySubmit}
        preloadedContext={{
          queue_ticket: {
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            service_name: ticket.services?.name,
          },
          facility_id: ticket.facility_id,
          facility_name: ticket.facilities?.name,
        }}
      />
    </AppLayout>
  );
}

export default QueueTicketPage;
