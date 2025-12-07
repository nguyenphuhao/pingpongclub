import { z } from 'zod';
import { User, UserRole, UserStatus } from '../types';

/**
 * User DTOs
 */

// ============================================
// CREATE USER
// ============================================

export const CreateUserDtoSchema = z.object({
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  firebaseUid: z.string().optional(),
  provider: z.string().optional(), // 'google.com', 'facebook.com', 'password', 'phone'
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  avatar: z.string().url().optional(),
  password: z.string().min(6).optional(), // Optional if using Firebase
  role: z.nativeEnum(UserRole).optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserDtoSchema>;

// ============================================
// UPDATE USER
// ============================================

export const UpdateUserDtoSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserDtoSchema>;

// ============================================
// UPDATE USER STATUS (Admin only)
// ============================================

export const UpdateUserStatusDtoSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export type UpdateUserStatusDto = z.infer<typeof UpdateUserStatusDtoSchema>;

// ============================================
// UPDATE USER ROLE (Admin only)
// ============================================

export const UpdateUserRoleDtoSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export type UpdateUserRoleDto = z.infer<typeof UpdateUserRoleDtoSchema>;

// ============================================
// QUERY USERS
// ============================================

export const QueryUsersDtoSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().nullish(),
  role: z.nativeEnum(UserRole).nullish(),
  status: z.nativeEnum(UserStatus).nullish(),
  orderBy: z.string().optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type QueryUsersDto = z.infer<typeof QueryUsersDtoSchema>;

