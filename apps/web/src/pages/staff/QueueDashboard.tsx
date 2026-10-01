import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { AppLayout, PageHeader } from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/Button';
import { StatCard, EmptyState } from '@/components/ui/Card';
import { TicketStatusBadge, PriorityBadge } from '@/components/ui/Badge';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase';
import type { QueueTicket, QueueStats, PriorityLevel } from '@/types';
import toast from 'react-hot-toast';
import {
  Phone, RotateCcw, SkipForward, Play, CheckCircle, UserX,
  Clock, Users, CheckSquare, BarChart2, Plus, Volume2, VolumeX,
  Layers, Search, User, Sparkles, Check
} from 'lucide-react';
import { Select, type SelectItemType } from '@/components/base/select/select';

const COUNTERS = [
  { id: '00000000-0000-0000-0000-000000000040', name: 'Counter 1', number: 1, type: 'General Consultation' },
  { id: '00000000-0000-0000-0000-000000000041', name: 'Counter 2', number: 2, type: 'Rapid Desk' },
  { id: '00000000-0000-0000-0000-000000000042', name: 'Counter 3', number: 3, type: 'Priority / VIP' },
];

const AVAILABLE_SERVICES = [
  { id: '00000000-0000-0000-0000-000000000020', name: 'General Consultation', duration: 15 },
  { id: '00000000-0000-0000-0000-000000000021', name: 'Cardiology Specialist', duration: 25 },
  { id: '00000000-0000-0000-0000-000000000022', name: 'Diagnostic Lab Test', duration: 10 },
];

// Airport/clinic chime sound using Web Audio API
function playCallChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const now = audioCtx.currentTime;

    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.18); // E5
    gain2.gain.setValueAtTime(0.15, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.65);
  } catch {
    // AudioContext blocked by browser autoplay policy until interaction
  }
}

function StaffQueueDashboard() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCounterId, setSelectedCounterId] = useState(COUNTERS[0].id);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'waiting' | 'history'>('waiting');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);

  // Walk-in form state
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinServiceId, setWalkinServiceId] = useState(AVAILABLE_SERVICES[0].id);
  const [walkinPriority, setWalkinPriority] = useState<PriorityLevel>('normal');

  const [confirmAction, setConfirmAction] = useState<{
    action: string;
    ticketId: string;
    label: string;
  } | null>(null);

  const activeCounter = COUNTERS.find((c) => c.id === selectedCounterId) || COUNTERS[0];
  const facilityId = profile?.facility_id || '00000000-0000-0000-0000-000000000010';

  // 1. Get today's queue session
  const { data: sessionRes } = useQuery({
    queryKey: ['staff-session', facilityId],
    queryFn: () =>
      apiClient.get<{ success: true; data: { id: string } }>(
        `/queues/sessions/today?facility_id=${facilityId}`
      ),
    staleTime: 60000,
  });

  const sessionId = sessionRes?.data?.id || '00000000-0000-0000-0000-000000000030';

  // 2. Get queue tickets
  const { data: ticketsRes, isLoading: isTicketsLoading } = useQuery({
    queryKey: ['staff-tickets', sessionId],
    queryFn: () =>
      apiClient.get<{ success: true; data: QueueTicket[] }>(
        `/queues/${sessionId}/tickets`
      ),
    refetchInterval: 10000,
  });

  // 3. Get queue stats
  const { data: statsRes } = useQuery({
    queryKey: ['staff-stats', sessionId],
    queryFn: () =>
      apiClient.get<{ success: true; data: QueueStats }>(
        `/queues/${sessionId}/stats`
      ),
    refetchInterval: 15000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;
    try {
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
    } catch {
      // Graceful fallback when realtime is offline
    }
  }, [sessionId, queryClient]);

  const rawTickets = ticketsRes?.data || [];
  const stats = statsRes?.data;

  // Categorize tickets
  const waitingTickets = rawTickets.filter((t) => t.status === 'waiting');
  const currentTicket = rawTickets.find(
    (t) => t.status === 'in_service' || t.status === 'called'
  );
  const completedTickets = rawTickets.filter(
    (t) => t.status === 'completed' || t.status === 'skipped' || t.status === 'no_show'
  );

  // Filter for search
  const filteredWaiting = waitingTickets.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const num = t.ticket_number?.toLowerCase() || '';
    const name = t.profiles?.full_name?.toLowerCase() || '';
    const service = t.services?.name?.toLowerCase() || '';
    return num.includes(q) || name.includes(q) || service.includes(q);
  });

  // Mutation for ticket status operations
  const ticketMutation = useMutation({
    mutationFn: ({ action, ticketId, body }: { action: string; ticketId: string; body?: unknown }) =>
      apiClient.post(`/queues/tickets/${ticketId}/${action}`, body || {}),
    onSuccess: (_, variables) => {
      const messages: Record<string, string> = {
        call: 'Ticket called successfully',
        recall: 'Ticket returned to waiting queue',
        start: 'Service started',
        complete: 'Service completed successfully',
        skip: 'Ticket skipped',
        'no-show': 'Marked as no-show',
      };
      toast.success(messages[variables.action] || 'Action updated');
      queryClient.invalidateQueries({ queryKey: ['staff-tickets', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats', sessionId] });
      setConfirmAction(null);

      if (variables.action === 'call' && soundEnabled) {
        playCallChime();
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Operation failed');
    },
  });

  // Mutation for creating walk-in ticket
  const walkinMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/queues/join', {
        facility_id: facilityId,
        service_id: walkinServiceId,
        priority: walkinPriority,
        notes: walkinName ? `Walk-in: ${walkinName} (${walkinPhone || 'No phone'})` : undefined,
      }),
    onSuccess: () => {
      toast.success('Walk-in ticket generated');
      queryClient.invalidateQueries({ queryKey: ['staff-tickets', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['staff-stats', sessionId] });
      setIsWalkinModalOpen(false);
      setWalkinName('');
      setWalkinPhone('');
      setWalkinPriority('normal');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to issue ticket');
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
      body: { counter_id: selectedCounterId },
    });
  };

  return (
    <AppLayout role="staff">
      {/* Header with Counter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-hairline mb-6">
        <div>
          <h1 className="text-display-xs font-semibold text-ink tracking-tight">Queue Dashboard</h1>
          <p className="text-body-sm text-muted mt-0.5">
            Metro General Hospital • <span className="text-ink font-medium">{profile?.full_name || 'Staff'}</span> •{' '}
            <span className="inline-flex items-center gap-1.5 text-success font-medium">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Online
            </span>
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Sound alert toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`h-9 px-3 rounded-lg border text-caption font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${soundEnabled
                ? 'bg-primary/10 border-primary/20 text-primary'
                : 'bg-surface-soft border-hairline text-muted hover:text-ink'
              }`}
            title={soundEnabled ? 'Chime sound active' : 'Chime muted'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          {/* Counter Switcher with Select */}
          <div className="w-56 sm:w-64">
            <Select
              placeholder="Select Counter"
              items={COUNTERS.map((c) => ({
                id: c.id,
                label: `${c.name} (${c.type})`,
                supportingText: `Desk #${c.number}`,
                icon: <Layers size={14} />,
              }))}
              value={selectedCounterId}
              onChange={(val) => setSelectedCounterId(val)}
              triggerClassName="h-9 py-1 text-xs"
            >
              {(item) => (
                <Select.Item
                  id={item.id}
                  supportingText={item.supportingText}
                  icon={item.icon}
                >
                  {item.label}
                </Select.Item>
              )}
            </Select>
          </div>

          {/* Issue Walk-in ticket button */}
          <Button
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setIsWalkinModalOpen(true)}
          >
          Walk-in
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Waiting"
          value={stats?.waiting ?? waitingTickets.length}
          icon={<Clock size={16} />}
        />
        <StatCard
          label="In Service"
          value={stats?.in_service ?? (currentTicket?.status === 'in_service' ? 1 : 0)}
          icon={<Users size={16} />}
        />
        <StatCard
          label="Completed Today"
          value={stats?.completed ?? completedTickets.length}
          icon={<CheckSquare size={16} />}
        />
        <StatCard
          label="Avg. Service"
          value={`${stats?.avg_service_time_minutes || 12}m`}
          icon={<BarChart2 size={16} />}
        />
      </div>

      {/* Main Grid: Currently Serving (Left) & Waiting Queue (Right) */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Currently Serving */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-title-sm font-semibold text-ink">Currently Serving</h2>
            <span className="text-caption text-muted font-medium">
              {activeCounter.name}
            </span>
          </div>

          {currentTicket ? (
            <div className="bg-canvas border-2 border-primary rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-caption text-muted uppercase tracking-wider font-semibold">Active Token</p>
                  <p className="text-4xl font-extrabold text-ink tracking-tight font-display mt-0.5">
                    {currentTicket.ticket_number}
                  </p>
                </div>
                <TicketStatusBadge status={currentTicket.status} />
              </div>

              {/* Customer details */}
              <div className="bg-surface-soft border border-hairline rounded-lg p-3 mb-5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                    <User size={12} />
                  </div>
                  <span className="text-body-sm font-semibold text-ink">
                    {currentTicket.profiles?.full_name || 'Customer'}
                  </span>
                </div>

                {currentTicket.profiles?.phone && (
                  <p className="text-caption text-muted pl-8">
                    Phone: {currentTicket.profiles.phone}
                  </p>
                )}

                <div className="pt-2 border-t border-hairline/60 flex items-center justify-between text-body-sm">
                  <span className="text-muted text-caption">Service</span>
                  <span className="font-medium text-ink text-caption">
                    {currentTicket.services?.name || 'General Consultation'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-muted text-caption">Priority Level</span>
                  <PriorityBadge priority={currentTicket.priority} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2.5">
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
                    className="w-full bg-success hover:bg-success/90"
                    icon={<CheckCircle size={14} />}
                    onClick={() => handleAction('complete', currentTicket.id, true, 'Complete service')}
                    isLoading={ticketMutation.isPending}
                  >
                    Complete Service
                  </Button>
                )}

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RotateCcw size={12} />}
                    onClick={() => handleAction('recall', currentTicket.id)}
                    title="Return ticket to waiting queue"
                  >
                    Recall
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<SkipForward size={12} />}
                    onClick={() => handleAction('skip', currentTicket.id, true, 'Skip ticket')}
                    title="Skip this customer"
                  >
                    Skip
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<UserX size={12} />}
                    onClick={() => handleAction('no-show', currentTicket.id, true, 'Mark no-show')}
                    title="Mark as absent / no-show"
                  >
                    No-show
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-canvas border border-hairline rounded-xl p-8 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-surface-soft border border-hairline flex items-center justify-center mx-auto mb-3 text-muted">
                <Clock size={20} />
              </div>
              <p className="text-body-sm font-semibold text-ink mb-1">Counter is Available</p>
              <p className="text-caption text-muted mb-5">
                {waitingTickets.length > 0
                  ? `${waitingTickets.length} customer${waitingTickets.length > 1 ? 's' : ''} in line.`
                  : 'No customers currently waiting in the queue.'}
              </p>

              {waitingTickets.length > 0 ? (
                <Button
                  className="w-full"
                  icon={<Phone size={14} />}
                  onClick={() => handleAction('call', waitingTickets[0].id, false, 'Call next')}
                  isLoading={ticketMutation.isPending}
                >
                  Call Next Ticket ({waitingTickets[0].ticket_number})
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  icon={<Plus size={14} />}
                  onClick={() => setIsWalkinModalOpen(true)}
                >
                  Issue Walk-in Ticket
                </Button>
              )}
            </div>
          )}

          {/* Quick Counter Info */}
          <div className="bg-surface-soft border border-hairline rounded-xl p-4">
            <div className="flex items-center justify-between text-caption text-muted mb-2">
              <span>Counter Status</span>
              <span className="text-success font-semibold flex items-center gap-1">
                <Check size={12} /> Active
              </span>
            </div>
            <p className="text-body-sm font-semibold text-ink">{activeCounter.name}</p>
            <p className="text-caption text-muted mt-0.5">{activeCounter.type}</p>
          </div>
        </div>

        {/* Right Column: Queue List (Tabs: Waiting / History) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-surface-soft border border-hairline rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('waiting')}
                className={`px-3 py-1 rounded-md text-caption font-medium transition-all cursor-pointer ${activeTab === 'waiting'
                    ? 'bg-white text-ink shadow-xs'
                    : 'text-muted hover:text-ink'
                  }`}
              >
                Waiting Queue ({waitingTickets.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 rounded-md text-caption font-medium transition-all cursor-pointer ${activeTab === 'history'
                    ? 'bg-white text-ink shadow-xs'
                    : 'text-muted hover:text-ink'
                  }`}
              >
                Served History ({completedTickets.length})
              </button>
            </div>

            {/* Quick Call Next if there is no current ticket */}
            {!currentTicket && waitingTickets.length > 0 && activeTab === 'waiting' && (
              <Button
                size="sm"
                icon={<Phone size={14} />}
                onClick={() => handleAction('call', waitingTickets[0].id)}
                isLoading={ticketMutation.isPending}
              >
                Call Next ({waitingTickets[0].ticket_number})
              </Button>
            )}
          </div>

          {/* Search box for waiting queue */}
          {activeTab === 'waiting' && waitingTickets.length > 3 && (
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, customer name, or service..."
                className="w-full h-9 pl-9 pr-3 text-caption rounded-lg border border-hairline bg-canvas text-ink placeholder:text-muted outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>
          )}

          {/* List Content */}
          {activeTab === 'waiting' ? (
            isTicketsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-18 rounded-xl" />
                ))}
              </div>
            ) : filteredWaiting.length > 0 ? (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredWaiting.map((ticket, i) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between bg-canvas border border-hairline hover:border-gray-300 rounded-xl p-4 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-8 h-8 bg-surface-soft border border-hairline rounded-lg flex items-center justify-center text-caption font-bold text-muted shrink-0">
                        #{i + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-body-sm font-bold text-ink tracking-tight font-display">
                            {ticket.ticket_number}
                          </p>
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                        <p className="text-caption text-ink font-medium truncate mt-0.5">
                          {ticket.profiles?.full_name || 'Walk-in Customer'}
                        </p>
                        <p className="text-caption text-muted truncate">
                          {ticket.services?.name || 'General Consultation'} • Joined{' '}
                          {ticket.joined_at ? new Date(ticket.joined_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Phone size={12} />}
                        onClick={() => handleAction('call', ticket.id)}
                        isLoading={ticketMutation.isPending}
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
                title="Waiting Queue is Empty"
                description={
                  searchQuery
                    ? 'No matching tickets found for this query.'
                    : 'All patients and customers have been attended to.'
                }
              />
            )
          ) : (
            /* History Tab */
            completedTickets.length > 0 ? (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {completedTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between bg-canvas border border-hairline rounded-xl p-4 opacity-90"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-8 h-8 bg-surface-soft rounded-lg flex items-center justify-center text-caption font-semibold text-muted shrink-0">
                        <Check size={14} className="text-success" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-body-sm font-bold text-ink">
                            {ticket.ticket_number}
                          </p>
                          <TicketStatusBadge status={ticket.status} />
                        </div>
                        <p className="text-caption text-muted truncate mt-0.5">
                          {ticket.profiles?.full_name || 'Customer'} • {ticket.services?.name || 'Consultation'}
                        </p>
                      </div>
                    </div>
                    <span className="text-caption text-muted">
                      {ticket.completed_at
                        ? new Date(ticket.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Completed'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CheckSquare size={20} />}
                title="No completed tickets yet"
                description="Completed sessions will appear here as they finish."
              />
            )
          )}
        </div>
      </div>

      {/* Walk-in Ticket Modal */}
      <Modal
        isOpen={isWalkinModalOpen}
        onClose={() => setIsWalkinModalOpen(false)}
        title="Issue Walk-in Ticket"
        description="Generate an immediate queue token for a customer arriving at the facility."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            walkinMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          <div>
            <label className="block text-caption font-semibold text-ink mb-1.5">
              Customer Full Name
            </label>
            <input
              type="text"
              value={walkinName}
              onChange={(e) => setWalkinName(e.target.value)}
              placeholder="e.g. Ramesh Chandra"
              required
              className="w-full h-10 px-3 rounded-lg border border-hairline text-body-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-caption font-semibold text-ink mb-1.5">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={walkinPhone}
              onChange={(e) => setWalkinPhone(e.target.value)}
              placeholder="+91-9876543210"
              className="w-full h-10 px-3 rounded-lg border border-hairline text-body-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>

          <Select
            isRequired
            label="Service Requested"
            tooltip="Choose the department or clinical consultation service"
            hint="Determines estimated service duration and queue routing"
            placeholder="Select a service"
            items={AVAILABLE_SERVICES.map((s) => ({
              id: s.id,
              label: s.name,
              supportingText: `~${s.duration} mins`,
            }))}
            value={walkinServiceId}
            onChange={(val) => setWalkinServiceId(val)}
          >
            {(item) => (
              <Select.Item
                id={item.id}
                supportingText={item.supportingText}
              >
                {item.label}
              </Select.Item>
            )}
          </Select>

          <div>
            <label className="block text-caption font-semibold text-ink mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['normal', 'priority', 'emergency'] as PriorityLevel[]).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setWalkinPriority(p)}
                  className={`h-9 rounded-lg text-caption font-semibold capitalize border transition-all cursor-pointer ${walkinPriority === p
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface-soft border-hairline text-ink hover:bg-surface-strong'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-hairline">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsWalkinModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={walkinMutation.isPending}
              icon={<Sparkles size={14} />}
            >
              Generate Token
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() =>
          confirmAction &&
          ticketMutation.mutate({
            action: confirmAction.action,
            ticketId: confirmAction.ticketId,
            body: { counter_id: selectedCounterId },
          })
        }
        title={confirmAction?.label || 'Confirm action'}
        description="Are you sure you want to perform this queue action?"
        isDanger={['skip', 'no-show'].includes(confirmAction?.action || '')}
        isLoading={ticketMutation.isPending}
      />
    </AppLayout>
  );
}

export default StaffQueueDashboard;
