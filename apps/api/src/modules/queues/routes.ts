import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { requireStaff } from '../../middleware/roles';
import { validateBody } from '../../middleware/validation';
import {
  joinQueueSchema,
  callTicketSchema,
  transferTicketSchema,
  updateTicketStatusSchema,
} from './schema';
import { QueueRepository } from './repository';
import { queueOperationLimiter } from '../../middleware/rateLimit';

const router = Router();
const queueRepo = new QueueRepository();

/**
 * POST /api/v1/queues/join
 * Customer: Join a queue.
 */
router.post(
  '/join',
  authenticate,
  queueOperationLimiter,
  validateBody(joinQueueSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await queueRepo.joinQueue(req.user!.id, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/queues/:sessionId
 * Get queue session stats.
 */
router.get(
  '/:sessionId/stats',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const stats = await queueRepo.getQueueStats(req.params.sessionId as string);
      res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/queues/:sessionId/tickets
 * Staff: Get all tickets in a session.
 */
router.get(
  '/:sessionId/tickets',
  authenticate,
  requireStaff,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const tickets = await queueRepo.getSessionTickets(req.params.sessionId as string);
      res.json({ success: true, data: tickets });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/queues/sessions/today
 * Staff: Get today's active session for a facility.
 */
router.get(
  '/sessions/today',
  authenticate,
  requireStaff,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { facility_id, service_id } = req.query as Record<string, string>;
      if (!facility_id) {
        res.status(400).json({ success: false, message: 'facility_id is required', code: 'BAD_REQUEST' });
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      const session = await queueRepo.getOrCreateSession(facility_id, service_id || '', today);
      res.json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/queues/tickets/active
 * Customer: Get their currently active queue ticket.
 */
router.get(
  '/tickets/active',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { supabaseAdmin } = await import('../../lib/supabase');
      const { data, error } = await supabaseAdmin
        .from('queue_tickets')
        .select(`
          *,
          services(name, duration_minutes),
          facilities(name, address),
          counters(name, number)
        `)
        .eq('customer_id', req.user!.id)
        .in('status', ['waiting', 'called', 'checked_in', 'in_service'])
        .order('joined_at', { ascending: false })
        .limit(1);

      if (error) throw new Error(error.message);
      res.json({ success: true, data: data || [] });
    } catch {
      res.json({ success: true, data: [] });
    }
  }
);

/**
 * GET /api/v1/tickets/:ticketId
 * Get ticket status (customer or staff).
 */
router.get(
  '/tickets/:ticketId',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const isCustomer = req.user!.role === 'customer';
      const ticket = await queueRepo.getTicket(
        req.params.ticketId as string,
        isCustomer ? req.user!.id : undefined
      );
      res.json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/tickets/:ticketId/cancel
 * Customer: Cancel their own ticket.
 */
router.patch(
  '/tickets/:ticketId/cancel',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const ticket = await queueRepo.getTicket(req.params.ticketId as string, req.user!.id);
      const updated = await queueRepo.transitionStatus(
        req.params.ticketId as string,
        'cancelled',
        req.user!.id
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/tickets/:ticketId/call
 * Staff: Call a ticket.
 */
router.post(
  '/tickets/:ticketId/call',
  authenticate,
  requireStaff,
  validateBody(callTicketSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await queueRepo.transitionStatus(
        req.params.ticketId as string,
        'called',
        req.user!.id,
        { counter_id: req.body.counter_id }
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/tickets/:ticketId/recall
 * Staff: Recall (return to waiting).
 */
router.post(
  '/tickets/:ticketId/recall',
  authenticate,
  requireStaff,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await queueRepo.transitionStatus(
        req.params.ticketId as string,
        'waiting',
        req.user!.id
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/tickets/:ticketId/start
 * Staff: Start service.
 */
router.post(
  '/tickets/:ticketId/start',
  authenticate,
  requireStaff,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await queueRepo.transitionStatus(
        req.params.ticketId as string,
        'in_service',
        req.user!.id
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/tickets/:ticketId/complete
 * Staff: Complete service.
 */
router.post(
  '/tickets/:ticketId/complete',
  authenticate,
  requireStaff,
  validateBody(updateTicketStatusSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await queueRepo.transitionStatus(
        req.params.ticketId as string,
        'completed',
        req.user!.id,
        { notes: req.body.notes }
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/tickets/:ticketId/skip
 * Staff: Skip a ticket.
 */
router.post(
  '/tickets/:ticketId/skip',
  authenticate,
  requireStaff,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await queueRepo.transitionStatus(
        req.params.ticketId as string,
        'skipped',
        req.user!.id
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/tickets/:ticketId/no-show
 * Staff: Mark no-show.
 */
router.post(
  '/tickets/:ticketId/no-show',
  authenticate,
  requireStaff,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await queueRepo.transitionStatus(
        req.params.ticketId as string,
        'no_show',
        req.user!.id
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/tickets/:ticketId/transfer
 * Staff: Transfer ticket to another counter.
 */
router.post(
  '/tickets/:ticketId/transfer',
  authenticate,
  requireStaff,
  validateBody(transferTicketSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = await queueRepo.transitionStatus(
        req.params.ticketId as string,
        'transferred',
        req.user!.id,
        { counter_id: req.body.counter_id, notes: req.body.reason }
      );
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
