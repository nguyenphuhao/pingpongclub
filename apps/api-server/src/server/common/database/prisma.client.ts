/**
 * This file is deprecated - use @pingclub/database instead
 * Re-export for backward compatibility
 */

export { prisma } from '@pingclub/database';

/**
 * Helper để disconnect (dùng trong testing hoặc cleanup)
 */
export async function disconnectPrisma() {
  const { prisma } = await import('@pingclub/database');
  await prisma.$disconnect();
}

