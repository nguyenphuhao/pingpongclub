/**
 * This file is deprecated - use @dokifree/database instead
 * Re-export for backward compatibility
 */

export { prisma } from '@dokifree/database';

/**
 * Helper để disconnect (dùng trong testing hoặc cleanup)
 */
export async function disconnectPrisma() {
  const { prisma } = await import('@dokifree/database');
  await prisma.$disconnect();
}

