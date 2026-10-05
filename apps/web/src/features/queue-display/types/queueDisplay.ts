import type { PriorityLevel, TicketStatus } from '@/types';

export interface DisplayTicket {
  id: string;
  ticket_number: string;
  status: TicketStatus;
  priority: PriorityLevel;
  counter_id?: string;
  counter_name?: string;
  counter_number?: number;
  service_id?: string;
  service_name?: string;
  called_at?: string;
  joined_at: string;
}

export interface DisplayCounter {
  id: string;
  name: string;
  number: number;
  type?: string;
  status: 'available' | 'busy' | 'offline' | 'standby';
  current_ticket_number?: string;
  current_ticket_id?: string;
  service_name?: string;
}

export interface QueueDisplayData {
  facilityName: string;
  facilityAddress?: string;
  serviceFilter: string;
  currentServing: DisplayTicket | null;
  activeCounters: DisplayCounter[];
  nextTickets: DisplayTicket[];
  totalWaiting: number;
  totalServedToday: number;
  isConnected: boolean;
  isReconnecting: boolean;
  lastUpdated: string;
}
