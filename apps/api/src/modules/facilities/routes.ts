import { Router, Request, Response, NextFunction } from 'express';
import { FacilityService } from './service';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../../middleware/auth';
import { requireAdmin, requireSystemAdmin } from '../../middleware/roles';
import { validateBody } from '../../middleware/validation';
import { createFacilitySchema, updateFacilitySchema } from './schema';

const router = Router();
const service = new FacilityService();

/**
 * GET /api/v1/facilities
 * Public: List all active facilities (optional auth).
 */
router.get('/', optionalAuthenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, city, search } = req.query as Record<string, string>;
    const facilities = await service.listFacilities({ category, city, search });
    res.json({ success: true, data: facilities });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/facilities/:id
 * Public: Get facility details.
 */
router.get('/:id', optionalAuthenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const facility = await service.getFacility(req.params.id as string);
    res.json({ success: true, data: facility });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/facilities
 * Admin: Create a new facility.
 */
router.post(
  '/',
  authenticate,
  requireAdmin,
  validateBody(createFacilitySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const facility = await service.createFacility(
        req.body,
        req.user!.id,
        'default-org' // In a real scenario, get org from user profile
      );
      res.status(201).json({ success: true, data: facility });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/facilities/:id
 * Admin: Update facility.
 */
router.patch(
  '/:id',
  authenticate,
  requireAdmin,
  validateBody(updateFacilitySchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const facility = await service.updateFacility(
        req.params.id as string,
        req.body,
        req.user!.id,
        req.user!.role
      );
      res.json({ success: true, data: facility });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/v1/facilities/:id
 * System Admin: Soft delete facility.
 */
router.delete(
  '/:id',
  authenticate,
  requireSystemAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await service.deleteFacility(req.params.id as string, req.user!.role);
      res.json({ success: true, data: { message: 'Facility deactivated' } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
