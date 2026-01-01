import { prisma, AdminRole, AdminStatus } from '@pingclub/database';
import { verifyPassword } from '../utils/password';

export interface AdminUser {
  id: string;
  username: string;
  email: string | null;
  role: AdminRole;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Verify admin credentials using username and password
 */
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<AdminUser | null> {
  // Find admin by username
  const admin = await prisma.admin.findFirst({
    where: {
      username,
      status: AdminStatus.ACTIVE,
      deletedAt: null,
    },
  });

  if (!admin) return null;

  // Verify password
  const isValidPassword = await verifyPassword(password, admin.password);
  if (!isValidPassword) return null;

  // Update last login
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    firstName: admin.firstName,
    lastName: admin.lastName,
  };
}

/**
 * Check if admin user exists and is active
 */
export async function isAdmin(adminId: string): Promise<boolean> {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { status: true, deletedAt: true },
  });
  
  return admin?.status === AdminStatus.ACTIVE && admin.deletedAt === null;
}

/**
 * Get admin user by ID
 */
export async function getAdminUser(adminId: string): Promise<AdminUser | null> {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin || admin.status !== AdminStatus.ACTIVE || admin.deletedAt !== null) {
    return null;
  }

  return {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    firstName: admin.firstName,
    lastName: admin.lastName,
  };
}

