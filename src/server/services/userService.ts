import { Prisma } from '@prisma/client';
import { prisma, checkDatabaseConnection } from '../db/prisma';
import { SafeUser, UserRole } from '../types';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

export interface UserRecord extends SafeUser {
  passwordHash: string;
}

export class DuplicateEmailError extends Error {
  statusCode = 409;
  constructor(message = 'An account with this email address already exists') {
    super(message);
    this.name = 'DuplicateEmailError';
  }
}

// In-memory fallback repository for environments without a live PostgreSQL instance (e.g., offline CI)
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
   * Reports whether real PostgreSQL is active or if in-memory fallback is used.
   */
  async getActiveStore(): Promise<'REAL_POSTGRESQL' | 'IN_MEMORY_FALLBACK'> {
    const isDbConnected = await checkDatabaseConnection();
    return isDbConnected ? 'REAL_POSTGRESQL' : 'IN_MEMORY_FALLBACK';
  },

  /**
   * Look up a user record by normalized email.
   */
  async findByEmail(email: string): Promise<UserRecord | null> {
    const isDbConnected = await checkDatabaseConnection();

    if (isDbConnected) {
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
    }

    // Fallback store ONLY when PostgreSQL is unavailable
    const found = Array.from(memoryUsers.values()).find((u) => u.email === email);
    return found || null;
  },

  /**
   * Look up safe user profile by ID. Never returns passwordHash.
   */
  async findById(id: string): Promise<SafeUser | null> {
    const isDbConnected = await checkDatabaseConnection();

    if (isDbConnected) {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      if (user) {
        return toSafeUser(user);
      }
      return null;
    }

    // Fallback store ONLY when PostgreSQL is unavailable
    const found = memoryUsers.get(id);
    if (found) {
      return toSafeUser(found);
    }
    return null;
  },

  /**
   * Creates a new user record. Enforces role=USER by default.
   */
  async create(data: CreateUserData): Promise<SafeUser> {
    const isDbConnected = await checkDatabaseConnection();

    if (isDbConnected) {
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
      } catch (err: unknown) {
        // Handle PostgreSQL unique constraint violation (P2002) directly
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new DuplicateEmailError('An account with this email address already exists');
        }
        throw err;
      }
    }

    // In-memory fallback ONLY if database server is genuinely unavailable
    const existing = Array.from(memoryUsers.values()).find((u) => u.email === data.email);
    if (existing) {
      throw new DuplicateEmailError('An account with this email address already exists');
    }

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
  },

  /**
   * Deletes a user by email (for test lifecycle cleanup).
   */
  async deleteByEmail(email: string): Promise<void> {
    const isDbConnected = await checkDatabaseConnection();
    if (isDbConnected) {
      await prisma.user.deleteMany({
        where: { email },
      });
    } else {
      for (const [id, user] of memoryUsers.entries()) {
        if (user.email === email) {
          memoryUsers.delete(id);
        }
      }
    }
  },

  /**
   * Helper to reset memory store for test suite isolation.
   */
  _clearMemoryStore(): void {
    memoryUsers.clear();
  },
};
