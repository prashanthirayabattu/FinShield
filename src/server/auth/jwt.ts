import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtTokenPayload, UserRole } from '../types';

const TOKEN_EXPIRY = '2h';
export const AUTH_COOKIE_NAME = 'finshield_auth_token';

/**
 * Signs a stateless JSON Web Token for the authenticated user session.
 */
export function signAuthToken(user: { id: string; email: string; role: UserRole }): string {
  const payload: JwtTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

/**
 * Verifies and decodes an auth token. Returns null if invalid or expired.
 */
export function verifyAuthToken(token: string): JwtTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtTokenPayload;
    if (!decoded.userId || !decoded.email || !decoded.role) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
