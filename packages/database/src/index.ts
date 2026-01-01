import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton
 * Shared database client for all apps in the monorepo
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Re-export all Prisma types
export * from '@prisma/client';

// Export rating utilities
export * from './rating.utils';

// Export default for convenience
export default prisma;

