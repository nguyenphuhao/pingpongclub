import { prisma } from '@dokifree/database';
import { LoginHistoryEntity, LoginMethod, LoginStatus } from '../domain/login-history.entity';
import { DevicePlatform } from '@/shared/types';

/**
 * Login History Repository
 * Quản lý data access cho login history
 */

export interface CreateLoginHistoryData {
  userId: string;
  platform: DevicePlatform;
  deviceId?: string;
  deviceModel?: string;
  osVersion?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  loginMethod: LoginMethod;
  status?: LoginStatus;
  failureReason?: string;
  refreshTokenId?: string;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export class LoginHistoryRepository {
  /**
   * Create login history record
   */
  async create(data: CreateLoginHistoryData): Promise<LoginHistoryEntity> {
    const loginHistory = await prisma.loginHistory.create({
      data: {
        userId: data.userId,
        platform: data.platform,
        deviceId: data.deviceId,
        deviceModel: data.deviceModel,
        osVersion: data.osVersion,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
        loginMethod: data.loginMethod,
        status: data.status || LoginStatus.SUCCESS,
        failureReason: data.failureReason,
        refreshTokenId: data.refreshTokenId,
      },
    });

    return new LoginHistoryEntity(loginHistory);
  }

  /**
   * Find login history by user ID với pagination
   */
  async findByUserId(
    userId: string,
    options?: PaginationOptions
  ): Promise<LoginHistoryEntity[]> {
    const loginHistories = await prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { loginAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return loginHistories.map((h) => new LoginHistoryEntity(h));
  }

  /**
   * Count total login history records for a user
   */
  async countByUserId(userId: string): Promise<number> {
    return await prisma.loginHistory.count({
      where: { userId },
    });
  }

  /**
   * Find active sessions (sessions with valid refresh tokens)
   */
  async findActiveSessions(userId: string): Promise<LoginHistoryEntity[]> {
    const activeSessions = await prisma.loginHistory.findMany({
      where: {
        userId,
        status: LoginStatus.SUCCESS,
        refreshTokenId: { not: null },
        refreshToken: {
          expiresAt: { gt: new Date() },
        },
      },
      include: {
        refreshToken: true,
      },
      orderBy: { loginAt: 'desc' },
    });

    return activeSessions.map((h) => new LoginHistoryEntity(h));
  }

  /**
   * Find login history by refresh token ID
   */
  async findByRefreshTokenId(refreshTokenId: string): Promise<LoginHistoryEntity | null> {
    const loginHistory = await prisma.loginHistory.findUnique({
      where: { refreshTokenId },
    });

    return loginHistory ? new LoginHistoryEntity(loginHistory) : null;
  }

  /**
   * Find login history by ID
   */
  async findById(id: string): Promise<LoginHistoryEntity | null> {
    const loginHistory = await prisma.loginHistory.findUnique({
      where: { id },
    });

    return loginHistory ? new LoginHistoryEntity(loginHistory) : null;
  }

  /**
   * Delete login history by ID
   */
  async deleteById(id: string): Promise<void> {
    await prisma.loginHistory.delete({
      where: { id },
    });
  }

  /**
   * Delete login history by refresh token ID
   */
  async deleteByRefreshTokenId(refreshTokenId: string): Promise<void> {
    await prisma.loginHistory.deleteMany({
      where: { refreshTokenId },
    });
  }
}

/**
 * Singleton instance
 */
export const loginHistoryRepository = new LoginHistoryRepository();

/**
 * Trong NestJS:
 * 
 * @Injectable()
 * export class LoginHistoryRepository {
 *   constructor(private prisma: PrismaService) {}
 *   
 *   async create(data: CreateLoginHistoryData) {
 *     // ... implementation
 *   }
 * }
 */

