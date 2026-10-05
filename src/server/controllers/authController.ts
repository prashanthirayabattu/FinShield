import { Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { AUTH_COOKIE_NAME } from '../auth/jwt';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../types';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: 2 * 60 * 60 * 1000, // 2 hours
  path: '/',
});

export const authController = {
  /**
   * POST /api/auth/register
   */
  async register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, token } = await authService.register(req.body);

      // Set HttpOnly auth cookie
      res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());

      res.status(201).json({
        message: 'Account registered successfully',
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, token } = await authService.login(req.body);

      // Set HttpOnly auth cookie
      res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());

      res.status(200).json({
        message: 'Login successful',
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie(AUTH_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: (env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
        path: '/',
      });

      res.status(200).json({
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/me
   */
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: missing authentication session' });
        return;
      }

      // Strictly derive user from verified session ID, never from query/body parameters
      const user = await userService.findById(req.user.id);

      if (!user) {
        res.status(404).json({ error: 'User profile not found' });
        return;
      }

      res.status(200).json({
        user,
      });
    } catch (err) {
      next(err);
    }
  },
};
