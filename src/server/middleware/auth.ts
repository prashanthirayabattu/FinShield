import { Response, NextFunction } from 'express';
import { verifyAuthToken, AUTH_COOKIE_NAME } from '../auth/jwt';
import { AuthenticatedRequest } from '../types';

/**
 * Authentication middleware that verifies JWT and attaches verified user identity to req.user.
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  let token: string | undefined;

  // 1. Primary: Extract from secure HttpOnly cookie
  if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
    token = req.cookies[AUTH_COOKIE_NAME];
  }

  // 2. Secondary fallback: Extract from Authorization Bearer header (for automated testing / CLI)
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({
      error: 'Authentication required: missing or empty authorization token',
    });
    return;
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    res.status(401).json({
      error: 'Authentication failed: invalid or expired session token',
    });
    return;
  }

  // Attach server-derived verified identity
  req.user = {
    id: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  next();
};
