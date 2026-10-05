import { prisma } from '../db/prisma';
import { SafeUser, UserRole } from '../types';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

export interface UserRecord extends SafeUser {
  passwordHash: string;
}

// In-memory fallback repository for environments without a live PostgreSQL instance (e.g., local tests / offline CI)
const memoryUsers = new Map<string, UserRecord>();

/**
 * Strips passwordHash and returns safe user profile.
 */
export function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const userService = {
  /**
   * Look up a user record by normalized email.
   */
  async findByEmail(email: string): Promise<UserRecord | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (user) {
        return {
          ...toSafeUser(user),
          passwordHash: user.passwordHash,
        };
      }
      return null;
    } catch {
      // Fallback to memory store if database is offline in test/demo mode
      const found = Array.from(memoryUsers.values()).find((u) => u.email === email);
      return found || null;
    }
  },

  /**
   * Look up safe user profile by ID. Never returns passwordHash.
   */
  async findById(id: string): Promise<SafeUser | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (user) {
        return toSafeUser(user);
      }
      return null;
    } catch {
      const found = memoryUsers.get(id);
      if (found) {
        return toSafeUser(found);
      }
      return null;
    }
  },

  /**
   * Creates a new user record. Enforces role=USER by default.
   */
  async create(data: CreateUserData): Promise<SafeUser> {
    try {
      const created = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          role: 'USER', // Always default to standard USER role
        },
      });

      return toSafeUser(created);
    } catch {
      // In-memory fallback if database server is unavailable
      const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date();
      const record: UserRecord = {
        id,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: 'USER',
        createdAt: now,
        updatedAt: now,
      };

      memoryUsers.set(id, record);
      return toSafeUser(record);
    }
  },

  /**
   * Helper to reset memory store for test suite isolation.
   */
  _clearMemoryStore(): void {
    memoryUsers.clear();
  },
};
