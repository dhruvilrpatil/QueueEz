import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    facilityId?: string;
  };
}

/**
 * Middleware: Validates database auth JWT and attaches user to request.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Missing or invalid authorization header',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Support local development / demo tokens only in non-production mode
    if (token.startsWith('demo-token-')) {
      if (process.env.NODE_ENV === 'production') {
        res.status(401).json({
          success: false,
          message: 'Development tokens are rejected in production environment',
          code: 'UNAUTHORIZED',
        });
        return;
      }
      const role = token.replace('demo-token-', '');
      const demoUsers: Record<string, { id: string; email: string; role: string; facilityId?: string }> = {
        customer: { id: '00000000-0000-0000-0000-000000000001', email: 'customer@demo.com', role: 'customer' },
        staff: { id: '00000000-0000-0000-0000-000000000002', email: 'staff@demo.com', role: 'staff', facilityId: '00000000-0000-0000-0000-000000000010' },
        admin: { id: '00000000-0000-0000-0000-000000000003', email: 'admin@demo.com', role: 'facility_admin', facilityId: '00000000-0000-0000-0000-000000000010' },
        facility_admin: { id: '00000000-0000-0000-0000-000000000003', email: 'admin@demo.com', role: 'facility_admin', facilityId: '00000000-0000-0000-0000-000000000010' },
      };
      req.user = demoUsers[role] || demoUsers.customer;
      next();
      return;
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN',
      });
      return;
    }

    // Load profile to get role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, facility_id')
      .eq('id', user.id)
      .single();

    req.user = {
      id: user.id,
      email: user.email || '',
      role: profile?.role || 'customer',
      facilityId: profile?.facility_id,
    };

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware: Optional authentication (attaches user if token present, proceeds either way).
 */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (token.startsWith('demo-token-')) {
      if (process.env.NODE_ENV === 'production') {
        return next();
      }
      const role = token.replace('demo-token-', '');
      const demoUsers: Record<string, { id: string; email: string; role: string; facilityId?: string }> = {
        customer: { id: '00000000-0000-0000-0000-000000000001', email: 'customer@demo.com', role: 'customer' },
        staff: { id: '00000000-0000-0000-0000-000000000002', email: 'staff@demo.com', role: 'staff', facilityId: '00000000-0000-0000-0000-000000000010' },
        admin: { id: '00000000-0000-0000-0000-000000000003', email: 'admin@demo.com', role: 'facility_admin', facilityId: '00000000-0000-0000-0000-000000000010' },
        facility_admin: { id: '00000000-0000-0000-0000-000000000003', email: 'admin@demo.com', role: 'facility_admin', facilityId: '00000000-0000-0000-0000-000000000010' },
      };
      req.user = demoUsers[role] || demoUsers.customer;
      return next();
    }
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
      const isBootstrap = !!(
        bootstrapEmail &&
        user.email &&
        user.email.trim().toLowerCase() === bootstrapEmail
      );

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, facility_id')
        .eq('id', user.id)
        .single();

      let userRole = profile?.role;
      let facilityId = profile?.facility_id;
      if (isBootstrap) {
        userRole = 'facility_admin';
        facilityId = facilityId || '00000000-0000-0000-0000-000000000010';
      }

      req.user = {
        id: user.id,
        email: user.email || '',
        role: userRole || 'customer',
        facilityId: facilityId || undefined,
      };
    }

    next();
  } catch {
    next();
  }
};
