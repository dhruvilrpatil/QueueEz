import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { supabaseAdmin } from '../../lib/supabase';
import { Response } from 'express';

const router = Router();

/**
 * GET /api/v1/auth/me
 * Returns the authenticated user's profile.
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.id.startsWith('00000000-0000-0000-0000-00000000000')) {
      const demoNames: Record<string, string> = {
        customer: 'Demo Customer',
        staff: 'Dr. Jane Smith (Staff)',
        facility_admin: 'Administrator (Metro Hospital)',
        admin: 'Administrator (Metro Hospital)',
      };
      return res.json({
        success: true,
        data: {
          id: req.user.id,
          email: req.user.email,
          full_name: demoNames[req.user.role] || 'Demo User',
          role: req.user.role,
          facility_id: req.user.facilityId,
          phone: '+91-9876543210',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        facility_id,
        avatar_url,
        created_at,
        updated_at
      `)
      .eq('id', req.user!.id)
      .single();

    if (error || !profile) {
      // Fallback profile if record not yet synced
      return res.json({
        success: true,
        data: {
          id: req.user!.id,
          email: req.user!.email,
          full_name: req.user!.email.split('@')[0],
          role: req.user!.role,
          facility_id: req.user!.facilityId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

/**
 * PATCH /api/v1/auth/profile
 * Updates the authenticated user's profile.
 */
router.patch('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { full_name, phone } = req.body;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (full_name) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.user!.id)
      .select()
      .single();

    if (error) {
      res.status(400).json({
        success: false,
        message: error.message,
        code: 'UPDATE_FAILED',
      });
      return;
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      code: 'INTERNAL_SERVER_ERROR',
    });
  }
});

export default router;
