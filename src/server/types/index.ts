import { Request } from 'express';

export type UserRole = 'USER' | 'ADMIN';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface JwtTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
