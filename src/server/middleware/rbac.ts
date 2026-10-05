import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';

/**
 * RBAC authorization middleware to restrict endpoint access by role.
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized: authentication context required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden: insufficient role privileges',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
      return;
    }

    next();
  };
};
