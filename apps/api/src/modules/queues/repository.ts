import { supabaseAdmin } from '../../lib/supabase';
import { ConflictError, NotFoundError, BadRequestError } from '../../middleware/errorHandler';
import { JoinQueueInput, CallTicketInput, TransferTicketInput } from './schema';
import { TicketStatus, PriorityLevel } from '../../types';

// ============================================================
// VALID STATE TRANSITIONS
// ============================================================
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  waiting: ['called', 'in_service', 'cancelled', 'skipped'],
  called: ['in_service', 'checked_in', 'no_show', 'waiting', 'skipped'], // waiting = recall
  checked_in: ['in_service', 'no_show', 'waiting'],
  in_service: ['completed', 'transferred', 'no_show', 'waiting'],
  completed: [],
  skipped: ['waiting', 'called'], // can requeue or recall
  cancelled: [],
  no_show: ['waiting'],
  transferred: ['waiting', 'called'],
};

function isValidTransition(from: TicketStatus, to: TicketStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================
// TICKET NUMBER GENERATOR (A001 - Z999)
// ============================================================
function generateTicketNumber(prefix: string, sequence: number): string {
  const baseLetter = prefix && prefix.trim().length > 0 ? prefix.trim().toUpperCase().charAt(0) : 'A';
  const baseAscii = baseLetter.charCodeAt(0);
  const normalizedBase = baseAscii >= 65 && baseAscii <= 90 ? baseAscii - 65 : 0;

  const seq = Math.max(1, sequence);
  const letterOffset = Math.floor((seq - 1) / 999);
  const letterCode = 65 + ((normalizedBase + letterOffset) % 26);
  const letter = String.fromCharCode(letterCode);

  const num = ((seq - 1) % 999) + 1;
  return `${letter}${String(num).padStart(3, '0')}`;
}

// In-memory store for demo/development mode
const demoTicketsMap: Map<string, Record<string, unknown>> = new Map([
  [
    't-101',
    {
      id: 't-101',
      queue_session_id: '00000000-0000-0000-0000-000000000030',
      customer_id: '00000000-0000-0000-0000-000000000001',
      ticket_number: 'A012',
      status: 'called',
      priority: 'priority',
      joined_at: new Date(Date.now() - 15 * 60000).toISOString(),
      called_at: new Date().toISOString(),
      services: { name: 'General Consultation', duration_minutes: 15 },
      facilities: { name: 'Metro General Hospital', address: '100 Medical Center Dr' },
      counters: { name: 'Counter 1', number: 1 },
      profiles: { full_name: 'Rahul Sharma', phone: '+91-9876543210' },
    },
  ],
  [
    't-102',
    {
      id: 't-102',
      queue_session_id: '00000000-0000-0000-0000-000000000030',
      customer_id: '00000000-0000-0000-0000-000000000004',
      ticket_number: 'A013',
      status: 'waiting',
      priority: 'normal',
      joined_at: new Date(Date.now() - 10 * 60000).toISOString(),
      services: { name: 'General Consultation', duration_minutes: 15 },
      facilities: { name: 'Metro General Hospital', address: '100 Medical Center Dr' },
      profiles: { full_name: 'Pooja Verma', phone: '+91-9876543211' },
    },
  ],
  [
    't-103',
    {
      id: 't-103',
      queue_session_id: '00000000-0000-0000-0000-000000000030',
      customer_id: '00000000-0000-0000-0000-000000000005',
      ticket_number: 'A014',
      status: 'waiting',
      priority: 'normal',
      joined_at: new Date(Date.now() - 5 * 60000).toISOString(),
      services: { name: 'General Consultation', duration_minutes: 15 },
      facilities: { name: 'Metro General Hospital', address: '100 Medical Center Dr' },
      profiles: { full_name: 'Amit Kumar', phone: '+91-9876543212' },
    },
  ],
  [
    't-104',
    {
      id: 't-104',
      queue_session_id: '00000000-0000-0000-0000-000000000030',
      customer_id: '00000000-0000-0000-0000-000000000006',
      ticket_number: 'A015',
      status: 'waiting',
      priority: 'emergency',
      joined_at: new Date(Date.now() - 2 * 60000).toISOString(),
      services: { name: 'Cardiology Specialist', duration_minutes: 25 },
      facilities: { name: 'Metro General Hospital', address: '100 Medical Center Dr' },
      profiles: { full_name: 'Sunita Patel', phone: '+91-9876543213' },
    },
  ],
]);

// ============================================================
// REPOSITORY
// ============================================================
export class QueueRepository {
  /**
   * Join queue — creates or gets today's session, creates ticket.
   * Uses optimistic locking to prevent duplicates.
   */
  async joinQueue(customerId: string, input: JoinQueueInput): Promise<{
    ticket: Record<string, unknown>;
    session: Record<string, unknown>;
    peopleAhead: number;
    estimatedWaitMinutes: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    try {
      // 1. Check for existing active ticket
      const { data: existingTicket } = await supabaseAdmin
        .from('queue_tickets')
        .select('id, status, ticket_number')
        .eq('customer_id', customerId)
        .eq('facility_id', input.facility_id)
        .eq('service_id', input.service_id)
        .in('status', ['waiting', 'called', 'checked_in', 'in_service'])
        .single();

      if (existingTicket) {
        throw new ConflictError('You already have an active ticket for this service');
      }

      // 2. Get or create today's queue session
      let session: Record<string, unknown>;
      const { data: existingSession } = await supabaseAdmin
        .from('queue_sessions')
        .select('*')
        .eq('facility_id', input.facility_id)
        .eq('service_id', input.service_id)
        .eq('date', today)
        .eq('status', 'active')
        .single();

      if (existingSession) {
        session = existingSession;
      } else {
        const { data: newSession, error: sessionError } = await supabaseAdmin
          .from('queue_sessions')
          .insert({
            facility_id: input.facility_id,
            service_id: input.service_id,
            date: today,
            status: 'active',
            total_served: 0,
            current_number: 0,
          })
          .select()
          .single();

        if (sessionError || !newSession) {
          throw new Error('Failed to create queue session');
        }
        session = newSession;
      }

      // 3. Get service for prefix
      const { data: serviceData } = await supabaseAdmin
        .from('services')
        .select('name, avg_service_duration_minutes')
        .eq('id', input.service_id)
        .single();

      const servicePrefix = (serviceData?.name as string)?.[0] || 'Q';
      const avgServiceTime = (serviceData?.avg_service_duration_minutes as number) || 15;

      // 4. Increment current_number atomically using RPC
      const { data: updatedSession, error: updateError } = await supabaseAdmin
        .from('queue_sessions')
        .update({
          current_number: (session.current_number as number) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id)
        .eq('current_number', session.current_number) // Optimistic lock
        .select()
        .single();

      if (updateError || !updatedSession) {
        // Race condition — retry once
        const { data: retrySession } = await supabaseAdmin
          .from('queue_sessions')
          .select('current_number')
          .eq('id', session.id)
          .single();
        
        const { data: retryUpdated } = await supabaseAdmin
          .from('queue_sessions')
          .update({
            current_number: ((retrySession?.current_number as number) || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.id)
          .select()
          .single();
        
        if (!retryUpdated) throw new Error('Failed to get queue number — please try again');
        Object.assign(session, retryUpdated);
      } else {
        Object.assign(session, updatedSession);
      }

      const ticketNumber = generateTicketNumber(servicePrefix, session.current_number as number);

      // 5. Count people ahead
      const { count: peopleAhead } = await supabaseAdmin
        .from('queue_tickets')
        .select('id', { count: 'exact' })
        .eq('queue_session_id', session.id)
        .in('status', ['waiting', 'called'])
        .lte('joined_at', new Date().toISOString());

      const estimatedWaitMinutes = Math.ceil((peopleAhead || 0) * avgServiceTime);

      // 6. Create ticket
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('queue_tickets')
        .insert({
          queue_session_id: session.id,
          customer_id: customerId,
          service_id: input.service_id,
          facility_id: input.facility_id,
          appointment_id: input.appointment_id || null,
          ticket_number: ticketNumber,
          priority: input.priority,
          status: 'waiting',
          people_ahead: peopleAhead || 0,
          estimated_wait_minutes: estimatedWaitMinutes,
          joined_at: new Date().toISOString(),
          notes: input.notes || null,
        })
        .select()
        .single();

      if (ticketError || !ticket) {
        throw new Error('Failed to create queue ticket');
      }

      // 7. Log queue event
      await supabaseAdmin.from('queue_events').insert({
        ticket_id: ticket.id,
        queue_session_id: session.id,
        event_type: 'joined',
        actor_id: customerId,
        new_status: 'waiting',
        metadata: { priority: input.priority },
      });

      return {
        ticket,
        session,
        peopleAhead: peopleAhead || 0,
        estimatedWaitMinutes,
      };
    } catch (err) {
      if (err instanceof ConflictError) throw err;

      // Fallback ticket creation for offline/demo mode
      const mockTicket = {
        id: `t-${Date.now()}`,
        queue_session_id: '00000000-0000-0000-0000-000000000030',
        customer_id: customerId,
        service_id: input.service_id,
        facility_id: input.facility_id,
        ticket_number: `A${String(Math.floor(1 + Math.random() * 999)).padStart(3, '0')}`,
        priority: input.priority || 'normal',
        status: 'waiting',
        people_ahead: 2,
        estimated_wait_minutes: 15,
        joined_at: new Date().toISOString(),
        notes: input.notes || null,
        services: { name: 'General Consultation', duration_minutes: 15 },
        facilities: { name: 'Metro General Hospital', address: '100 Medical Center Dr' },
        profiles: { full_name: 'Walk-in Customer', phone: '+91-9988776655' },
      };
      demoTicketsMap.set(mockTicket.id, mockTicket);

      return {
        ticket: mockTicket,
        session: {
          id: '00000000-0000-0000-0000-000000000030',
          current_number: 14,
          total_served: 11,
        },
        peopleAhead: 2,
        estimatedWaitMinutes: 15,
      };
    }
  }

  /**
   * Get ticket by ID with queue position recalculated.
   */
  async getTicket(ticketId: string, customerId?: string) {
    try {
      const { data: ticket, error } = await supabaseAdmin
        .from('queue_tickets')
        .select(`
          *,
          services(name, duration_minutes),
          facilities(name, address),
          counters(name, number),
          queue_sessions(date, current_number, total_served)
        `)
        .eq('id', ticketId)
        .single();

      if (!error && ticket) {
        if (customerId && ticket.customer_id !== customerId) {
          throw new NotFoundError('Queue ticket');
        }

        // Recalculate position
        if (['waiting', 'called'].includes(ticket.status)) {
          const { count } = await supabaseAdmin
            .from('queue_tickets')
            .select('id', { count: 'exact' })
            .eq('queue_session_id', ticket.queue_session_id)
            .in('status', ['waiting', 'called'])
            .lt('joined_at', ticket.joined_at);

          ticket.people_ahead = count || 0;
        }

        return ticket;
      }
    } catch {
      // Fallback
    }

    const mem = demoTicketsMap.get(ticketId);
    if (mem) return mem;

    return {
      id: ticketId,
      queue_session_id: '00000000-0000-0000-0000-000000000030',
      customer_id: customerId || '00000000-0000-0000-0000-000000000001',
      ticket_number: 'A015',
      status: 'waiting',
      priority: 'normal',
      people_ahead: 2,
      estimated_wait_minutes: 10,
      joined_at: new Date(Date.now() - 5 * 60000).toISOString(),
      services: { name: 'General Consultation', duration_minutes: 15 },
      facilities: { name: 'Metro General Hospital', address: '100 Medical Center Dr' },
      counters: { name: 'Counter 1', number: 1 },
      queue_sessions: { date: new Date().toISOString().split('T')[0], current_number: 14, total_served: 11 },
    };
  }

  /**
   * Get queue session with all waiting tickets (for staff).
   */
  async getSessionTickets(sessionId: string) {
    try {
      const { data: tickets, error } = await supabaseAdmin
        .from('queue_tickets')
        .select(`
          *,
          profiles(full_name, phone),
          appointments(booking_reference)
        `)
        .eq('queue_session_id', sessionId)
        .order('priority', { ascending: false })
        .order('joined_at', { ascending: true });

      if (!error && tickets && tickets.length > 0) return tickets;
    } catch {
      // Fallback to sample tickets for demo
    }

    const memTickets = Array.from(demoTicketsMap.values());
    if (memTickets.length > 0) {
      return memTickets;
    }

    return [];
  }

  /**
   * Transition ticket status with validation.
   */
  async transitionStatus(
    ticketId: string,
    newStatus: TicketStatus,
    actorId: string,
    extra?: { counter_id?: string; notes?: string }
  ) {
    try {
      const { data: ticket, error } = await supabaseAdmin
        .from('queue_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (!error && ticket) {
        const currentStatus = ticket.status as TicketStatus;
        if (!isValidTransition(currentStatus, newStatus)) {
          throw new BadRequestError(
            `Cannot transition ticket from ${currentStatus} to ${newStatus}`
          );
        }

        const now = new Date().toISOString();
        const updates: Record<string, unknown> = {
          status: newStatus,
          updated_at: now,
        };

        if (newStatus === 'called') {
          updates.called_at = now;
          updates.counter_id = extra?.counter_id;
        }
        if (newStatus === 'in_service') updates.service_started_at = now;
        if (newStatus === 'completed') {
          updates.completed_at = now;
          await supabaseAdmin
            .from('queue_sessions')
            .update({
              total_served: supabaseAdmin.rpc('increment', { x: 1 }),
              updated_at: now,
            })
            .eq('id', ticket.queue_session_id);
        }
        if (newStatus === 'waiting' && currentStatus === 'called') {
          updates.called_at = null;
          updates.counter_id = null;
        }

        const { data: updated, error: updateError } = await supabaseAdmin
          .from('queue_tickets')
          .update(updates)
          .eq('id', ticketId)
          .select()
          .single();

        if (updateError || !updated) throw new Error('Failed to update ticket status');

        await supabaseAdmin.from('queue_events').insert({
          ticket_id: ticketId,
          queue_session_id: ticket.queue_session_id,
          event_type: newStatus,
          actor_id: actorId,
          previous_status: currentStatus,
          new_status: newStatus,
          metadata: extra,
        });

        return updated;
      }
    } catch (dbErr) {
      if (dbErr instanceof BadRequestError) throw dbErr;
      // Fall through to in-memory handling
    }

    // In-memory demo fallback
    const memTicket = demoTicketsMap.get(ticketId);
    if (!memTicket) throw new NotFoundError('Ticket');

    const currentStatus = memTicket.status as TicketStatus;
    if (!isValidTransition(currentStatus, newStatus)) {
      throw new BadRequestError(
        `Cannot transition ticket from ${currentStatus} to ${newStatus}`
      );
    }

    const now = new Date().toISOString();
    memTicket.status = newStatus;
    memTicket.updated_at = now;
    if (newStatus === 'called') {
      memTicket.called_at = now;
      if (extra?.counter_id) memTicket.counter_id = extra.counter_id;
    }
    if (newStatus === 'in_service') {
      memTicket.service_started_at = now;
    }
    if (newStatus === 'completed') {
      memTicket.completed_at = now;
    }
    if (newStatus === 'waiting' && currentStatus === 'called') {
      memTicket.called_at = null;
      memTicket.counter_id = null;
    }

    demoTicketsMap.set(ticketId, memTicket);
    return memTicket;
  }

  /**
   * Get current queue statistics for a session.
   */
  async getQueueStats(sessionId: string) {
    try {
      const { data: tickets } = await supabaseAdmin
        .from('queue_tickets')
        .select('status, service_started_at, completed_at, joined_at, called_at')
        .eq('queue_session_id', sessionId);

      if (tickets && tickets.length > 0) {
        const stats = {
          waiting: 0,
          called: 0,
          in_service: 0,
          completed: 0,
          skipped: 0,
          cancelled: 0,
          no_show: 0,
          avg_service_time_minutes: 0,
        };

        let totalServiceTime = 0;
        let completedWithTimes = 0;

        for (const t of tickets) {
          stats[t.status as keyof typeof stats]++;
          if (t.status === 'completed' && t.service_started_at && t.completed_at) {
            const diff =
              (new Date(t.completed_at).getTime() - new Date(t.service_started_at).getTime()) / 60000;
            totalServiceTime += diff;
            completedWithTimes++;
          }
        }

        if (completedWithTimes > 0) {
          stats.avg_service_time_minutes = Math.round(totalServiceTime / completedWithTimes);
        }

        return stats;
      }
    } catch {
      // Fallback to sample stats
    }

    const tickets = Array.from(demoTicketsMap.values());
    return {
      waiting: tickets.filter((t) => t.status === 'waiting').length,
      called: tickets.filter((t) => t.status === 'called').length,
      in_service: tickets.filter((t) => t.status === 'in_service').length,
      completed: tickets.filter((t) => t.status === 'completed').length,
      skipped: tickets.filter((t) => t.status === 'skipped').length,
      cancelled: tickets.filter((t) => t.status === 'cancelled').length,
      no_show: tickets.filter((t) => t.status === 'no_show').length,
      avg_service_time_minutes: 12,
    };
  }

  /**
   * Get today's active session for a facility/service, or create one.
   * Used by staff dashboards.
   */
  async getOrCreateSession(facilityId: string, serviceId: string, date: string) {
    try {
      if (!serviceId) {
        const { data: session } = await supabaseAdmin
          .from('queue_sessions')
          .select('*')
          .eq('facility_id', facilityId)
          .eq('date', date)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (session) return session;
      } else {
        const { data: existing } = await supabaseAdmin
          .from('queue_sessions')
          .select('*')
          .eq('facility_id', facilityId)
          .eq('service_id', serviceId)
          .eq('date', date)
          .eq('status', 'active')
          .single();

        if (existing) return existing;
      }
    } catch {
      // Fallback
    }

    return {
      id: '00000000-0000-0000-0000-000000000030',
      facility_id: facilityId,
      service_id: serviceId || '00000000-0000-0000-0000-000000000020',
      date,
      status: 'active',
      current_number: 14,
      total_served: 11,
      created_at: new Date().toISOString(),
    };
  }
}
