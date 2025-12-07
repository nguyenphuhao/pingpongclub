import { LoginHistoryRepository, loginHistoryRepository } from '../infrastructure/login-history.repository';
import { LoginHistoryEntity, LoginMethod, LoginStatus } from '../domain/login-history.entity';
import { DevicePlatform } from '@/shared/types';

/**
 * Login History Service (Application Layer)
 * Business logic cho login history management
 * KHÔNG phụ thuộc Next.js - framework agnostic
 */

export interface DeviceInfo {
  platform?: DevicePlatform;
  deviceId?: string;
  deviceModel?: string;
  osVersion?: string;
}

export interface RequestInfo {
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export interface PaginatedLoginHistory {
  data: LoginHistoryEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class LoginHistoryService {
  constructor(private repository: LoginHistoryRepository) {}

  /**
   * Record login attempt
   */
  async recordLogin(
    userId: string,
    loginMethod: LoginMethod,
    deviceInfo?: DeviceInfo,
    requestInfo?: RequestInfo,
    refreshTokenId?: string,
    status: LoginStatus = LoginStatus.SUCCESS,
    failureReason?: string
  ): Promise<LoginHistoryEntity> {
    return await this.repository.create({
      userId,
      platform: deviceInfo?.platform || DevicePlatform.WEB,
      deviceId: deviceInfo?.deviceId,
      deviceModel: deviceInfo?.deviceModel,
      osVersion: deviceInfo?.osVersion,
      ipAddress: requestInfo?.ipAddress,
      userAgent: requestInfo?.userAgent,
      location: requestInfo?.location,
      loginMethod,
      status,
      failureReason,
      refreshTokenId,
    });
  }

  /**
   * Get user login history với pagination
   */
  async getUserLoginHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedLoginHistory> {
    const offset = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findByUserId(userId, { limit, offset }),
      this.repository.countByUserId(userId),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get active sessions (sessions with valid refresh tokens)
   */
  async getActiveSessions(userId: string): Promise<LoginHistoryEntity[]> {
    return await this.repository.findActiveSessions(userId);
  }

  /**
   * Find login history by refresh token ID
   */
  async findByRefreshTokenId(refreshTokenId: string): Promise<LoginHistoryEntity | null> {
    return await this.repository.findByRefreshTokenId(refreshTokenId);
  }

  /**
   * Find login history by ID
   */
  async findById(id: string): Promise<LoginHistoryEntity | null> {
    return await this.repository.findById(id);
  }
}

/**
 * Singleton instance
 */
export const loginHistoryService = new LoginHistoryService(loginHistoryRepository);

/**
 * Trong NestJS:
 * 
 * @Injectable()
 * export class LoginHistoryService {
 *   constructor(
 *     private repository: LoginHistoryRepository,
 *   ) {}
 *   
 *   async recordLogin(...) {
 *     // ... implementation
 *   }
 * }
 */

