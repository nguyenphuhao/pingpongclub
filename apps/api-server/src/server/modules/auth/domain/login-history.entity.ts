import { LoginHistory as PrismaLoginHistory } from '@pingclub/database';
import { DevicePlatform } from '@/shared/types';

/**
 * Login History Domain Entity
 * Đây là layer domain, chứa business logic và validation rules
 * Sau này trong NestJS: có thể là TypeORM Entity hoặc Prisma model wrapper
 */

export enum LoginMethod {
  FIREBASE = 'FIREBASE',
  OTP_EMAIL = 'OTP_EMAIL',
  OTP_PHONE = 'OTP_PHONE',
}

export enum LoginStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export class LoginHistoryEntity {
  id: string;
  userId: string;
  platform: DevicePlatform;
  deviceId?: string | null;
  deviceModel?: string | null;
  osVersion?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  location?: string | null;
  loginMethod: LoginMethod;
  status: LoginStatus;
  failureReason?: string | null;
  loginAt: Date;
  refreshTokenId?: string | null;

  constructor(data: PrismaLoginHistory) {
    this.id = data.id;
    this.userId = data.userId;
    this.platform = data.platform as DevicePlatform;
    this.deviceId = data.deviceId;
    this.deviceModel = data.deviceModel;
    this.osVersion = data.osVersion;
    this.ipAddress = data.ipAddress;
    this.userAgent = data.userAgent;
    this.location = data.location;
    this.loginMethod = data.loginMethod as LoginMethod;
    this.status = data.status as LoginStatus;
    this.failureReason = data.failureReason;
    this.loginAt = data.loginAt;
    this.refreshTokenId = data.refreshTokenId;
  }

  /**
   * Business logic methods
   */

  isSuccess(): boolean {
    return this.status === LoginStatus.SUCCESS;
  }

  isFailed(): boolean {
    return this.status === LoginStatus.FAILED;
  }

  /**
   * Check if login is recent (within specified minutes)
   */
  isRecent(minutes: number = 5): boolean {
    const diff = Date.now() - this.loginAt.getTime();
    return diff < minutes * 60 * 1000;
  }

  /**
   * Get platform display name
   */
  getPlatformName(): string {
    switch (this.platform) {
      case DevicePlatform.IOS:
        return 'iOS';
      case DevicePlatform.ANDROID:
        return 'Android';
      case DevicePlatform.WEB:
        return 'Web';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get login method display name
   */
  getLoginMethodName(): string {
    switch (this.loginMethod) {
      case LoginMethod.FIREBASE:
        return 'Firebase';
      case LoginMethod.OTP_EMAIL:
        return 'OTP (Email)';
      case LoginMethod.OTP_PHONE:
        return 'OTP (Phone)';
      case LoginMethod.PASSWORD_EMAIL:
        return 'Password (Email)';
      case LoginMethod.PASSWORD_PHONE:
        return 'Password (Phone)';
      default:
        return 'Unknown';
    }
  }

  /**
   * Convert to safe JSON (exclude sensitive data if needed)
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      platform: this.platform,
      deviceId: this.deviceId,
      deviceModel: this.deviceModel,
      osVersion: this.osVersion,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      location: this.location,
      loginMethod: this.loginMethod,
      status: this.status,
      failureReason: this.failureReason,
      loginAt: this.loginAt,
      refreshTokenId: this.refreshTokenId,
    };
  }
}

/**
 * Trong NestJS với TypeORM:
 * 
 * @Entity('login_history')
 * export class LoginHistoryEntity {
 *   @PrimaryGeneratedColumn('uuid')
 *   id: string;
 *   
 *   @Column()
 *   userId: string;
 *   
 *   // ... other columns
 *   
 *   // business methods here
 * }
 */

