import { Router, Request, Response, NextFunction } from 'express';
import { FacilityService } from './service';
import { authenticate, optionalAuthenticate, AuthenticatedRequest } from '../../middleware/auth';
import { requireAdmin, requireSystemAdmin } from '../../middleware/roles';
import { validateBody } from '../../middleware/validation';
import { createFacilitySchema, updateFacilitySchema } from './schema';
import { supabaseAdmin } from '../../lib/supabase';
import crypto from 'crypto';

const router = Router();
const service = new FacilityService();

export interface PersistedStaff {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: 'staff' | 'facility_admin' | 'system_admin';
  facility_id?: string;
  avatar_url?: string | null;
  desk?: string;
  created_at: string;
  updated_at: string;
}

// In-memory persistent cache for staff (survives requests and database fallback)
const persistedStaffMembers: PersistedStaff[] = [
  {
    id: '00000000-0000-0000-0000-000000000002',
    full_name: 'Dr. Jane Smith (Staff)',
    email: 'staff@demo.com',
    phone: '+91-9876543211',
    role: 'staff',
    facility_id: '00000000-0000-0000-0000-000000000010',
    avatar_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    desk: 'General OPD Desk',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * GET /api/v1/facilities/staff
 * Get staff directory members.
 */
router.get('/staff', optionalAuthenticate, async (_req: Request, res: Response) => {
  try {
    const list: PersistedStaff[] = [...persistedStaffMembers];
    try {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .in('role', ['staff', 'facility_admin', 'system_admin'])
        .order('created_at', { ascending: false });

      if (data && Array.isArray(data) && data.length > 0) {
        for (const p of data) {
          if (!list.some((m) => m.id === p.id || m.email.toLowerCase() === p.email.toLowerCase())) {
            list.unshift({
              id: p.id,
              full_name: p.full_name || p.email.split('@')[0],
              email: p.email,
              phone: p.phone,
              role: p.role,
              facility_id: p.facility_id,
              avatar_url: p.avatar_url,
              desk: 'General OPD Desk',
              created_at: p.created_at || new Date().toISOString(),
              updated_at: p.updated_at || new Date().toISOString(),
            });
          }
        }
      }
    } catch {}

    res.json({ success: true, data: list });
  } catch (err) {
    res.json({ success: true, data: persistedStaffMembers });
  }
});

/**
 * POST /api/v1/facilities/staff
 * Add staff directory member.
 */
router.post('/staff', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, full_name, email, role, phone, desk, avatar_url } = req.body;
    const staffName = (name || full_name || '').trim();
    const staffEmail = (email || '').trim().toLowerCase();
    const staffRole = role === 'facility_admin' ? 'facility_admin' : 'staff';
    const staffPhone = phone ? String(phone).trim() : null;
    const staffDesk = desk ? String(desk).trim() : 'General OPD Desk';

    if (!staffName || !staffEmail) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const memberId = crypto.randomUUID();
    const avatar = avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(staffName)}`;

    const newStaff: PersistedStaff = {
      id: memberId,
      full_name: staffName,
      email: staffEmail,
      phone: staffPhone,
      role: staffRole,
      facility_id: req.user?.facilityId || '00000000-0000-0000-0000-000000000010',
      avatar_url: avatar,
      desk: staffDesk,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Keep unique in memory cache
    const existingIdx = persistedStaffMembers.findIndex(
      (m) => m.email.toLowerCase() === staffEmail || m.id === memberId
    );
    if (existingIdx !== -1) {
      persistedStaffMembers[existingIdx] = newStaff;
    } else {
      persistedStaffMembers.unshift(newStaff);
    }

    // Try creating via Supabase Auth & profiles
    try {
      const { data: createdAuth } = await supabaseAdmin.auth.admin.createUser({
        email: staffEmail,
        password: 'StaffPassword2026!',
        email_confirm: true,
        user_metadata: { full_name: staffName },
      });
      if (createdAuth?.user) {
        newStaff.id = createdAuth.user.id;
        await supabaseAdmin
          .from('profiles')
          .update({
            full_name: staffName,
            role: staffRole,
            phone: staffPhone,
            avatar_url: avatar,
            facility_id: newStaff.facility_id,
          })
          .eq('id', createdAuth.user.id);
      }
    } catch {
      // In-memory persistent cache is authoritative
    }

    res.status(201).json({ success: true, data: newStaff });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to add staff member' });
  }
});

/**
 * DELETE /api/v1/facilities/staff/:id
 * Remove a staff directory member.
 */
router.delete('/staff/:id', optionalAuthenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const index = persistedStaffMembers.findIndex((m) => m.id === id);
    if (index !== -1) {
      persistedStaffMembers.splice(index, 1);
    }
    try {
      await supabaseAdmin.from('profiles').delete().eq('id', id);
      await supabaseAdmin.auth.admin.deleteUser(id);
    } catch {}

    res.json({ success: true, message: 'Staff member removed' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Failed to remove staff member' });
  }
});

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
