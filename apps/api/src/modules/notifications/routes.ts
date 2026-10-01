import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { supabaseAdmin } from '../../lib/supabase';

const router = Router();

/**
 * GET /api/v1/notifications
 * Get user's notifications.
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark notification as read.
 */
router.patch('/:id/read', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications as read.
 */
router.patch('/read-all', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user!.id)
      .eq('is_read', false);

    res.json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (err) {
    next(err);
  }
});

export default router;
