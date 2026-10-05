import type { UserProfile } from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000/api';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthApiResponse {
  user?: {
    id: string;
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    createdAt: string;
    updatedAt?: string;
  };
  message?: string;
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

export const authApi = {
  /**
   * Registers a new user with the FinShield backend.
   */
  async register(payload: RegisterPayload): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Receive and store HttpOnly cookie
      body: JSON.stringify(payload),
    });

    const data: AuthApiResponse = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (data.details && data.details.length > 0) {
        throw new Error(data.details.map((d) => d.message).join('. '));
      }
      throw new Error(data.error || 'Registration failed');
    }

    if (!data.user) {
      throw new Error('Malformed server response');
    }

    return {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      joinedDate: data.user.createdAt ? data.user.createdAt.split('T')[0] : '2026-10-05',
      securityStatus: 'SECURE',
    };
  },

  /**
   * Authenticates user with backend via credentials, setting HttpOnly session cookie.
   */
  async login(payload: LoginPayload): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data: AuthApiResponse = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'Invalid email or password');
    }

    if (!data.user) {
      throw new Error('Malformed server response');
    }

    return {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      joinedDate: data.user.createdAt ? data.user.createdAt.split('T')[0] : '2026-10-05',
      securityStatus: 'SECURE',
    };
  },

  /**
   * Ends authenticated session and clears HttpOnly session cookie.
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Local fallback on network failure
    }
  },

  /**
   * Fetches currently authenticated session user profile from verified cookie.
   */
  async getMe(): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) return null;

      const data: AuthApiResponse = await res.json();
      if (!data.user) return null;

      return {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        joinedDate: data.user.createdAt ? data.user.createdAt.split('T')[0] : '2026-10-05',
        securityStatus: 'SECURE',
      };
    } catch {
      return null;
    }
  },
};
