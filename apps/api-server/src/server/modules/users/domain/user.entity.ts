import { User as PrismaUser } from '@dokifree/database';
import { User, UserRole, UserStatus } from '@/shared/types';

/**
 * User Domain Entity
 * Đây là layer domain, chứa business logic và validation rules
 * Sau này trong NestJS: có thể là TypeORM Entity hoặc Prisma model wrapper
 */

export class UserEntity implements User {
  id: string;
  email: string;
  phone?: string | null;
  firebaseUid?: string | null;
  provider?: string | null;
  password?: string | null; // Hashed password - never expose in toJSON()
  
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  
  role: UserRole;
  status: UserStatus;
  
  emailVerified: boolean;
  phoneVerified: boolean;
  
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  constructor(data: PrismaUser) {
    this.id = data.id;
    this.email = data.email;
    this.phone = data.phone;
    this.firebaseUid = data.firebaseUid;
    this.provider = data.provider;
    this.password = data.password;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.avatar = data.avatar;
    this.role = data.role as UserRole;
    this.status = data.status as UserStatus;
    this.emailVerified = data.emailVerified;
    this.phoneVerified = data.phoneVerified;
    this.lastLoginAt = data.lastLoginAt;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.deletedAt = data.deletedAt;
  }

  /**
   * Business logic methods
   */

  get fullName(): string {
    return [this.firstName, this.lastName].filter(Boolean).join(' ') || 'Unknown';
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE && !this.deletedAt;
  }

  canLogin(): boolean {
    return this.isActive() && this.emailVerified;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isModerator(): boolean {
    return this.role === UserRole.MODERATOR || this.isAdmin();
  }

  /**
   * Convert to public profile (safe to expose)
   */
  toPublicProfile() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      avatar: this.avatar,
    };
  }

  /**
   * Convert to safe JSON (exclude sensitive data like password)
   */
  toJSON(): User {
    return {
      id: this.id,
      email: this.email,
      phone: this.phone,
      firebaseUid: this.firebaseUid,
      provider: this.provider,
      // password is intentionally excluded for security
      firstName: this.firstName,
      lastName: this.lastName,
      avatar: this.avatar,
      role: this.role,
      status: this.status,
      emailVerified: this.emailVerified,
      phoneVerified: this.phoneVerified,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}

/**
 * Trong NestJS với TypeORM:
 * 
 * @Entity('users')
 * export class UserEntity {
 *   @PrimaryGeneratedColumn('uuid')
 *   id: string;
 *   
 *   @Column({ unique: true })
 *   email: string;
 *   
 *   // ... other columns
 *   
 *   // business methods here
 * }
 */

