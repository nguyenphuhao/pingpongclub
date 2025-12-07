import { prisma } from '@dokifree/database';
import { nanoid } from 'nanoid';
import { DevicePlatform } from '@/shared/types';

/**
 * Auth Repository
 * Quản lý refresh tokens và auth-related data
 */

export interface CreateRefreshTokenData {
  userId: string;
  expiresIn?: number; // in seconds, default 30 days
  // Device & Session Info
  deviceId?: string;
  platform?: DevicePlatform;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthRepository {
  /**
   * Create refresh token với device info
   */
  async createRefreshToken(data: CreateRefreshTokenData) {
    const token = nanoid(64);
    const expiresIn = data.expiresIn || 30 * 24 * 60 * 60; // 30 days
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const refreshToken = await prisma.refreshToken.create({
      data: {
        token,
        userId: data.userId,
        expiresAt,
        deviceId: data.deviceId,
        platform: data.platform,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    return refreshToken;
  }

  /**
   * Find refresh token
   */
  async findRefreshToken(token: string) {
    return await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  /**
   * Verify refresh token (check if valid and not expired)
   */
  async verifyRefreshToken(token: string) {
    const refreshToken = await this.findRefreshToken(token);
    
    if (!refreshToken) {
      return null;
    }

    // Check if expired
    if (refreshToken.expiresAt < new Date()) {
      // Delete expired token
      await this.deleteRefreshToken(token);
      return null;
    }

    return refreshToken;
  }

  /**
   * Delete refresh token
   */
  async deleteRefreshToken(token: string) {
    await prisma.refreshToken.delete({
      where: { token },
    });
  }

  /**
   * Delete all refresh tokens for a user
   */
  async deleteAllRefreshTokensForUser(userId: string) {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens() {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  /**
   * Get all active refresh tokens for a user
   */
  async getUserRefreshTokens(userId: string) {
    return await prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  /**
   * Get refresh token by ID
   */
  async findRefreshTokenById(id: string) {
    return await prisma.refreshToken.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  /**
   * Delete refresh token by ID
   */
  async deleteRefreshTokenById(id: string): Promise<void> {
    await prisma.refreshToken.delete({
      where: { id },
    });
  }

  /**
   * Delete refresh token by device ID
   */
  async deleteRefreshTokenByDeviceId(userId: string, deviceId: string): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        userId,
        deviceId,
      },
    });
    return result.count;
  }

  /**
   * Delete all refresh tokens for a user except current token
   */
  async deleteAllRefreshTokensExcept(
    userId: string,
    excludeTokenId: string
  ): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        userId,
        id: { not: excludeTokenId },
      },
    });
    return result.count;
  }

  /**
   * Delete all refresh tokens for a user except current device
   */
  async deleteAllRefreshTokensExceptDevice(
    userId: string,
    excludeDeviceId: string
  ): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        userId,
        deviceId: { not: excludeDeviceId },
      },
    });
    return result.count;
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(token: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { token },
      data: { lastUsedAt: new Date() },
    });
  }
}

/**
 * Singleton instance
 */
export const authRepository = new AuthRepository();

/**
 * Trong NestJS:
 * 
 * @Injectable()
 * export class AuthRepository {
 *   constructor(private prisma: PrismaService) {}
 *   
 *   async createRefreshToken(data: CreateRefreshTokenData) {
 *     // ... implementation
 *   }
 * }
 */

