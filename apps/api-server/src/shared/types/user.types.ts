import { ID, Timestamps } from './common.types';

/**
 * User types - shared between FE and BE
 * Maps directly to Prisma User model
 */

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export interface User extends Timestamps {
  id: ID;
  email: string;
  phone?: string | null;
  firebaseUid?: string | null;
  provider?: string | null; // 'google.com', 'facebook.com', 'password', 'phone'
  
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  
  role: UserRole;
  status: UserStatus;
  
  emailVerified: boolean;
  phoneVerified: boolean;
  
  lastLoginAt?: Date | null;
}

// Public user profile (safe to expose to other users)
export interface UserProfile {
  id: ID;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
}

// Current user (includes private info)
export interface CurrentUser extends User {
  // Add any additional fields for authenticated user
}

