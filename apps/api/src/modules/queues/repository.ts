import { supabaseAdmin } from '../../lib/supabase';
import { ConflictError, NotFoundError, BadRequestError } from '../../middleware/errorHandler';
import { JoinQueueInput, CallTicketInput, TransferTicketInput } from './schema';
import { TicketStatus, PriorityLevel } from '../../types';

// ============================================================
// VALID STATE TRANSITIONS
// ============================================================
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  waiting: ['called', 'cancelled', 'skipped'],
  called: ['checked_in', 'no_show', 'waiting'], // waiting = recall
  checked_in: ['in_service', 'no_show'],
  in_service: ['completed', 'transferred'],
  completed: [],
  skipped: ['waiting'], // can requeue
  cancelled: [],
  no_show: [],
  transferred: ['waiting'],
};

function isValidTransition(from: TicketStatus, to: TicketStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ============================================================
// TICKET NUMBER GENERATOR
// ============================================================
function generateTicketNumber(prefix: string, sequence: number): string {
  return `${prefix.toUpperCase().slice(0, 1)}-${String(sequence).padStart(3, '0')}`;
}

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
  }

  /**
   * Get ticket by ID with queue position recalculated.
   */
  async getTicket(ticketId: string, customerId?: string) {
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

    if (error || !ticket) throw new NotFoundError('Queue ticket');

    // Verify ownership if customerId provided
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

  /**
   * Get queue session with all waiting tickets (for staff).
   */
  async getSessionTickets(sessionId: string) {
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

    if (error) throw new Error(error.message);
    return tickets || [];
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
    const { data: ticket, error } = await supabaseAdmin
      .from('queue_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) throw new NotFoundError('Ticket');

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
      // Update session total_served
      await supabaseAdmin
        .from('queue_sessions')
        .update({
          total_served: supabaseAdmin.rpc('increment', { x: 1 }),
          updated_at: now,
        })
        .eq('id', ticket.queue_session_id);
    }
    if (newStatus === 'waiting' && currentStatus === 'called') {
      // Recall — reset called_at
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

    // Log event
    await supabaseAdmin.from('queue_events').insert({
      ticket_id: ticketId,
      queue_session_id: ticket.queue_session_id,
      event_type: newStatus,
      actor_id: actorId,
      previous_status: currentStatus,
      new_status: newStatus,
      metadata: extra,
    });

    // Create notification for customer
    const notifMessages: Partial<Record<TicketStatus, string>> = {
      called: `Your ticket ${ticket.ticket_number} has been called. Please proceed to the counter.`,
      completed: `Your service has been completed. Thank you!`,
      no_show: `Your ticket ${ticket.ticket_number} was marked as no-show.`,
    };

    if (notifMessages[newStatus]) {
      await supabaseAdmin.from('notifications').insert({
        user_id: ticket.customer_id,
        type: `ticket_${newStatus}`,
        title: 'Queue Update',
        message: notifMessages[newStatus],
        data: { ticket_id: ticketId, ticket_number: ticket.ticket_number },
        is_read: false,
      });
    }

    return updated;
  }

  /**
   * Get current queue statistics for a session.
   */
  async getQueueStats(sessionId: string) {
    const { data: tickets } = await supabaseAdmin
      .from('queue_tickets')
      .select('status, service_started_at, completed_at, joined_at, called_at')
      .eq('queue_session_id', sessionId);

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

    if (!tickets) return stats;

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

  /**
   * Get today's active session for a facility/service, or create one.
   * Used by staff dashboards.
   */
  async getOrCreateSession(facilityId: string, serviceId: string, date: string) {
    // If serviceId is empty, find any active session for the facility
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

      return session || null;
    }

    const { data: existing } = await supabaseAdmin
      .from('queue_sessions')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('service_id', serviceId)
      .eq('date', date)
      .eq('status', 'active')
      .single();

    if (existing) return existing;

    const { data: created, error } = await supabaseAdmin
      .from('queue_sessions')
      .insert({
        facility_id: facilityId,
        service_id: serviceId,
        date,
        status: 'active',
        current_number: 0,
        total_served: 0,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created;
  }
}
