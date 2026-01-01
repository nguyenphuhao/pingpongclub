import { prisma } from '@pingclub/database';
import { AdminRole, AdminStatus } from '@pingclub/database';

/**
 * Admin Repository (Infrastructure Layer)
 * Database access cho Admin model
 */

export interface AdminEntity {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: AdminRole;
  status: AdminStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class AdminRepository {
  /**
   * Find admin by username
   */
  async findByUsername(username: string): Promise<AdminEntity | null> {
    const admin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) return null;

    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      avatar: admin.avatar,
      role: admin.role,
      status: admin.status,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      deletedAt: admin.deletedAt,
    };
  }

  /**
   * Find admin by ID
   */
  async findById(id: string): Promise<AdminEntity | null> {
    const admin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) return null;

    return {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      avatar: admin.avatar,
      role: admin.role,
      status: admin.status,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      deletedAt: admin.deletedAt,
    };
  }

  /**
   * Get admin password hash (for verification)
   */
  async getPasswordHash(id: string): Promise<string | null> {
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: { password: true },
    });

    return admin?.password || null;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await prisma.admin.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Check if admin is active
   */
  async isActive(id: string): Promise<boolean> {
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: { status: true, deletedAt: true },
    });

    return admin?.status === AdminStatus.ACTIVE && admin.deletedAt === null;
  }
}

/**
 * Singleton instance
 */
export const adminRepository = new AdminRepository();

