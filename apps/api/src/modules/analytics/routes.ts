import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';
import { supabaseAdmin } from '../../lib/supabase';

const router = Router();

/**
 * GET /api/v1/analytics/facility/:id
 * Get facility-level analytics.
 */
router.get('/facility/:id', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { period = '7d' } = req.query;

    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Appointments stats
    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select('status, created_at, date')
      .eq('facility_id', id)
      .gte('date', startDateStr);

    // Queue stats
    const { data: tickets } = await supabaseAdmin
      .from('queue_tickets')
      .select('status, joined_at, completed_at, service_started_at, estimated_wait_minutes')
      .eq('facility_id', id)
      .gte('joined_at', startDate.toISOString());

    // Calculate metrics
    const appointmentStats = {
      total: appointments?.length || 0,
      completed: appointments?.filter((a) => a.status === 'completed').length || 0,
      cancelled: appointments?.filter((a) => a.status === 'cancelled').length || 0,
      no_shows: appointments?.filter((a) => a.status === 'no_show').length || 0,
      scheduled: appointments?.filter((a) => a.status === 'scheduled').length || 0,
    };

    const completedTickets = tickets?.filter(
      (t) => t.status === 'completed' && t.service_started_at && t.completed_at
    ) || [];

    const avgServiceTime = completedTickets.length > 0
      ? Math.round(
          completedTickets.reduce((sum, t) => {
            const diff = (new Date(t.completed_at).getTime() - new Date(t.service_started_at).getTime()) / 60000;
            return sum + diff;
          }, 0) / completedTickets.length
        )
      : 0;

    const avgWaitTime = completedTickets.length > 0
      ? Math.round(
          completedTickets.reduce((sum, t) => sum + (t.estimated_wait_minutes || 0), 0) /
            completedTickets.length
        )
      : 0;

    const queueStats = {
      total_tickets: tickets?.length || 0,
      completed: completedTickets.length,
      cancelled: tickets?.filter((t) => t.status === 'cancelled').length || 0,
      no_shows: tickets?.filter((t) => t.status === 'no_show').length || 0,
      avg_service_time_minutes: avgServiceTime,
      avg_wait_time_minutes: avgWaitTime,
    };

    // Daily breakdown for chart
    const dailyData: Record<string, { appointments: number; queue: number; completed: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyData[key] = { appointments: 0, queue: 0, completed: 0 };
    }

    appointments?.forEach((a) => {
      if (dailyData[a.date]) dailyData[a.date].appointments++;
    });

    tickets?.forEach((t) => {
      const date = new Date(t.joined_at).toISOString().split('T')[0];
      if (dailyData[date]) {
        dailyData[date].queue++;
        if (t.status === 'completed') dailyData[date].completed++;
      }
    });

    const chartData = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    res.json({
      success: true,
      data: {
        period: `${days}d`,
        appointments: appointmentStats,
        queue: queueStats,
        chart: chartData,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/analytics/queue/:sessionId
 * Get queue session analytics.
 */
router.get('/queue/:sessionId', authenticate, requireAdmin, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { data: tickets } = await supabaseAdmin
      .from('queue_tickets')
      .select('*')
      .eq('queue_session_id', req.params.sessionId);

    const stats = {
      total: tickets?.length || 0,
      by_status: {} as Record<string, number>,
      by_priority: {} as Record<string, number>,
      avg_wait_minutes: 0,
      avg_service_minutes: 0,
    };

    if (tickets) {
      for (const t of tickets) {
        stats.by_status[t.status] = (stats.by_status[t.status] || 0) + 1;
        stats.by_priority[t.priority] = (stats.by_priority[t.priority] || 0) + 1;
      }
    }

    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

export default router;
