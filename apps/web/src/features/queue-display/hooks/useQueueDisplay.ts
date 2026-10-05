import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';
import type { QueueTicket, QueueStats, Facility, Counter } from '@/types';
import type { DisplayTicket, DisplayCounter, QueueDisplayData } from '../types/queueDisplay';
import { playQueueChime } from '../utils/chime';
import { useQueueDisplayRealtime } from './useQueueDisplayRealtime';

interface UseQueueDisplayOptions {
  serviceId?: string;
  soundEnabled?: boolean;
}

const DEFAULT_COUNTERS: DisplayCounter[] = [
  { id: 'c1', name: 'Counter 1', number: 1, type: 'General Consultation', status: 'available' },
  { id: 'c2', name: 'Counter 2', number: 2, type: 'Rapid Desk', status: 'available' },
  { id: 'c3', name: 'Counter 3', number: 3, type: 'Priority / VIP', status: 'available' },
];

export function useQueueDisplay(options: UseQueueDisplayOptions = {}) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { serviceId, soundEnabled = true } = options;

  const facilityId = profile?.facility_id || '00000000-0000-0000-0000-000000000010';
  const [justAnnouncedTicket, setJustAnnouncedTicket] = useState<string | null>(null);
  const previousServingIdRef = useRef<string | null>(null);

  // 1. Fetch facility details (name, address, counters)
  const { data: facilityRes, isLoading: isFacilityLoading } = useQuery({
    queryKey: ['tv-facility', facilityId],
    queryFn: () => apiClient.get<{ success: true; data: Facility }>(`/facilities/${facilityId}`),
    staleTime: 5 * 60 * 1000,
  });

  // 2. Fetch today's queue session for this facility
  const { data: sessionRes, isLoading: isSessionLoading } = useQuery({
    queryKey: ['tv-session', facilityId],
    queryFn: () =>
      apiClient.get<{ success: true; data: { id: string } }>(
        `/queues/sessions/today?facility_id=${facilityId}`
      ),
    staleTime: 60 * 1000,
  });

  const sessionId = sessionRes?.data?.id || '00000000-0000-0000-0000-000000000030';

  // 3. Fetch tickets for this session
  const { data: ticketsRes, isLoading: isTicketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ['tv-tickets', sessionId],
    queryFn: () =>
      apiClient.get<{ success: true; data: QueueTicket[] }>(`/queues/${sessionId}/tickets`),
    refetchInterval: 12000, // Background heartbeat
  });

  // 4. Fetch queue stats
  const { data: statsRes, refetch: refetchStats } = useQuery({
    queryKey: ['tv-stats', sessionId],
    queryFn: () =>
      apiClient.get<{ success: true; data: QueueStats }>(`/queues/${sessionId}/stats`),
    refetchInterval: 15000,
  });

  // Realtime hook
  const handleRealtimeUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tv-tickets', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['tv-stats', sessionId] });
    refetchTickets();
    refetchStats();
  }, [queryClient, sessionId, refetchTickets, refetchStats]);

  const { isConnected, isReconnecting } = useQueueDisplayRealtime({
    sessionId,
    facilityId,
    onQueueUpdate: handleRealtimeUpdate,
  });

  // Process and sanitize data (NO CUSTOMER PII EXPOSED)
  const rawTickets = ticketsRes?.data || [];
  const facility = facilityRes?.data;
  const stats = statsRes?.data;

  // Filter by service if specified
  const filteredTickets = serviceId
    ? rawTickets.filter((t) => t.service_id === serviceId)
    : rawTickets;

  // Find currently called or in-service tickets
  const activeServingTickets: DisplayTicket[] = filteredTickets
    .filter((t) => t.status === 'called' || t.status === 'in_service')
    .map((t) => ({
      id: t.id,
      ticket_number: t.ticket_number,
      status: t.status,
      priority: t.priority,
      counter_id: t.counter_id,
      counter_name: t.counters?.name || (t.counter_id ? `Counter ${t.counters?.number || ''}` : undefined),
      counter_number: t.counters?.number,
      service_id: t.service_id,
      service_name: t.services?.name,
      called_at: t.called_at || t.updated_at,
      joined_at: t.joined_at,
    }))
    .sort((a, b) => {
      // Most recently called first
      const timeA = new Date(a.called_at || 0).getTime();
      const timeB = new Date(b.called_at || 0).getTime();
      return timeB - timeA;
    });

  const primaryServing: DisplayTicket | null = activeServingTickets[0] || null;

  // Next tickets in line (waiting only)
  const nextTickets: DisplayTicket[] = filteredTickets
    .filter((t) => t.status === 'waiting')
    .slice(0, 8)
    .map((t) => ({
      id: t.id,
      ticket_number: t.ticket_number,
      status: t.status,
      priority: t.priority,
      service_id: t.service_id,
      service_name: t.services?.name,
      joined_at: t.joined_at,
    }));

  // Map active counters
  const rawCounters: Counter[] = facility?.counters || [];
  const activeCounters: DisplayCounter[] = (
    rawCounters.length > 0
      ? rawCounters.map((c) => ({
          id: c.id,
          name: c.name,
          number: c.number,
          status: (c.status as DisplayCounter['status']) || 'available',
        }))
      : DEFAULT_COUNTERS
  ).map((counter) => {
    // Check if a ticket is currently called or in service at this counter
    const activeTicket = activeServingTickets.find(
      (t) =>
        t.counter_id === counter.id ||
        (t.counter_number !== undefined && t.counter_number === counter.number) ||
        (t.counter_name && t.counter_name.toLowerCase().includes(`counter ${counter.number}`))
    );

    return {
      ...counter,
      status: activeTicket ? 'busy' : counter.status === 'offline' ? 'offline' : 'available',
      current_ticket_number: activeTicket?.ticket_number,
      current_ticket_id: activeTicket?.id,
      service_name: activeTicket?.service_name,
    };
  });

  // Sound and visual announcement pulse on new call
  useEffect(() => {
    if (!primaryServing) return;

    if (previousServingIdRef.current && previousServingIdRef.current !== primaryServing.id) {
      // A new ticket was called!
      setJustAnnouncedTicket(primaryServing.ticket_number);

      if (soundEnabled) {
        playQueueChime();
      }

      const timer = setTimeout(() => {
        setJustAnnouncedTicket(null);
      }, 4000);

      previousServingIdRef.current = primaryServing.id;
      return () => clearTimeout(timer);
    }

    previousServingIdRef.current = primaryServing.id;
  }, [primaryServing, soundEnabled]);

  const displayData: QueueDisplayData = {
    facilityName: facility?.name || 'Metro General Hospital',
    facilityAddress: facility?.address || '100 Medical Center Dr',
    serviceFilter: serviceId ? filteredTickets[0]?.services?.name || 'Selected Service' : 'All Services',
    currentServing: primaryServing,
    activeCounters,
    nextTickets,
    totalWaiting: stats?.waiting ?? filteredTickets.filter((t) => t.status === 'waiting').length,
    totalServedToday: stats?.completed ?? filteredTickets.filter((t) => t.status === 'completed').length,
    isConnected,
    isReconnecting,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  return {
    data: displayData,
    isLoading: isSessionLoading || isTicketsLoading || isFacilityLoading,
    justAnnouncedTicket,
    refetch: handleRealtimeUpdate,
  };
}
