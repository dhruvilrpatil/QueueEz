import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

type UserRole = 'customer' | 'staff' | 'facility_admin' | 'system_admin';

/**
 * Middleware factory: Requires user to have one of the specified roles.
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'FORBIDDEN',
        details: {
          required: roles,
          current: req.user.role,
        },
      });
      return;
    }

    next();
  };
};

/**
 * Middleware: Requires staff, facility_admin, or system_admin role.
 */
export const requireStaff = requireRole('staff', 'facility_admin', 'system_admin');

/**
 * Middleware: Requires facility_admin or system_admin role.
 */
export const requireAdmin = requireRole('facility_admin', 'system_admin');

/**
 * Middleware: Requires system_admin role only.
 */
export const requireSystemAdmin = requireRole('system_admin');
