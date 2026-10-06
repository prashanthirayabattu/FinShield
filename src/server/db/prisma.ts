import '../config/env';
import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development/test
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Checks connectivity to the database with resilient retries for serverless cold starts.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  return false;
}
