import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { requireStaff } from '../../middleware/roles';
import { validateBody } from '../../middleware/validation';
import {
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
} from './schema';
import { AppointmentRepository } from './repository';

const router = Router();
const repo = new AppointmentRepository();

/**
 * GET /api/v1/appointments
 * Customer: Get own appointments. Staff/Admin: Get facility appointments.
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, facility_id, date } = req.query as Record<string, string>;
    let appointments;

    if (req.user!.role === 'customer') {
      appointments = await repo.findByCustomer(req.user!.id, status);
    } else if (facility_id) {
      appointments = await repo.findByFacility(facility_id, date);
    } else {
      appointments = await repo.findByCustomer(req.user!.id, status);
    }

    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/appointments/slots
 * Get available time slots for a service on a date.
 */
router.get('/slots', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { facility_id, service_id, date } = req.query as Record<string, string>;
    if (!facility_id || !service_id || !date) {
      res.status(400).json({
        success: false,
        message: 'facility_id, service_id, and date are required',
        code: 'BAD_REQUEST',
      });
      return;
    }

    const slots = await repo.getAvailableSlots(facility_id, service_id, date);
    res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/appointments/:id
 * Get a specific appointment.
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const appointment = await repo.findById(req.params.id as string);
    // Check ownership unless staff/admin
    if (req.user!.role === 'customer' && appointment.customer_id !== req.user!.id) {
      res.status(404).json({ success: false, message: 'Appointment not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/appointments
 * Customer: Book an appointment.
 */
router.post(
  '/',
  authenticate,
  validateBody(createAppointmentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const appointment = await repo.create(req.user!.id, req.body);
      res.status(201).json({ success: true, data: appointment });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/appointments/:id/cancel
 * Customer: Cancel an appointment.
 */
router.patch(
  '/:id/cancel',
  authenticate,
  validateBody(cancelAppointmentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const appointment = await repo.cancel(
        req.params.id as string,
        req.user!.id,
        req.body.cancellation_reason
      );
      res.json({ success: true, data: appointment });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/appointments/:id/reschedule
 * Customer: Reschedule an appointment.
 */
router.patch(
  '/:id/reschedule',
  authenticate,
  validateBody(rescheduleAppointmentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const appointment = await repo.reschedule(req.params.id as string, req.user!.id, req.body);
      res.json({ success: true, data: appointment });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
