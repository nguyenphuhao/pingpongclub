import { z } from 'zod';
import { User, UserRole } from '../types';

/**
 * Auth DTOs with Zod validation
 * Sau này trong NestJS: dùng class-validator hoặc keep Zod
 */

// ============================================
// LOGIN
// ============================================

export const LoginDtoSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  phoneNumber: z.string().min(10, 'Invalid phone number').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
  deviceInfo: z.object({
    fcmToken: z.string().optional(),
    platform: z.enum(['IOS', 'ANDROID', 'WEB']).optional(),
    deviceId: z.string().optional(),
    model: z.string().optional(),
    osVersion: z.string().optional(),
  }).optional(),
}).refine(
  (data) => {
    const hasEmail = data.email && typeof data.email === 'string' && data.email.trim().length > 0;
    const hasPhone = data.phoneNumber && typeof data.phoneNumber === 'string' && data.phoneNumber.trim().length > 0;
    return (hasEmail && !hasPhone) || (!hasEmail && hasPhone);
  },
  { message: 'Either email or phoneNumber must be provided, but not both' }
);

export type LoginDto = z.infer<typeof LoginDtoSchema>;

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================
// REGISTER
// ============================================

export const RegisterDtoSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: z.string().optional(),
});

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;

export interface RegisterResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ============================================
// FIREBASE AUTH
// ============================================

export const FirebaseAuthDtoSchema = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required'),
  deviceInfo: z.object({
    fcmToken: z.string().optional(),
    platform: z.enum(['IOS', 'ANDROID', 'WEB']).optional(),
    deviceId: z.string().optional(),
    model: z.string().optional(),
    osVersion: z.string().optional(),
  }).optional(),
});

export type FirebaseAuthDto = z.infer<typeof FirebaseAuthDtoSchema>;

export interface FirebaseAuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

// ============================================
// REFRESH TOKEN
// ============================================

export const RefreshTokenDtoSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenDtoSchema>;

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================
// VERIFY EMAIL
// ============================================

export const VerifyEmailDtoSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type VerifyEmailDto = z.infer<typeof VerifyEmailDtoSchema>;

// ============================================
// FORGOT PASSWORD
// ============================================

export const ForgotPasswordDtoSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>;

// ============================================
// RESET PASSWORD
// ============================================

export const ResetPasswordDtoSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>;

// ============================================
// CHANGE PASSWORD
// ============================================

export const ChangePasswordDtoSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>;

// ============================================
// OTP REGISTRATION
// ============================================

export const RegisterWithOtpDtoSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  phoneNumber: z.string().min(10, 'Invalid phone number').optional(),
}).refine(
  (data) => {
    const hasEmail = data.email && typeof data.email === 'string' && data.email.trim().length > 0;
    const hasPhone = data.phoneNumber && typeof data.phoneNumber === 'string' && data.phoneNumber.trim().length > 0;
    return (hasEmail && !hasPhone) || (!hasEmail && hasPhone);
  },
  { message: 'Either email or phoneNumber must be provided, but not both' }
);

export type RegisterWithOtpDto = z.infer<typeof RegisterWithOtpDtoSchema>;

export interface RegisterWithOtpResponse {
  verificationId: string;
  message: string;
  expiresAt: string;
}

// ============================================
// VERIFY REGISTRATION
// ============================================

export const VerifyRegistrationDtoSchema = z.object({
  verificationId: z.string().min(1, 'Verification ID is required'),
  otpCode: z.string().length(6, 'OTP must be 6 digits'),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export type VerifyRegistrationDto = z.infer<typeof VerifyRegistrationDtoSchema>;

export interface VerifyRegistrationResponse {
  message: string;
  email?: string;
  phoneNumber?: string;
}

// ============================================
// OTP LOGIN
// ============================================

export const LoginWithOtpDtoSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  phoneNumber: z.string().min(10, 'Invalid phone number').optional(),
}).refine(
  (data) => {
    const hasEmail = data.email && typeof data.email === 'string' && data.email.trim().length > 0;
    const hasPhone = data.phoneNumber && typeof data.phoneNumber === 'string' && data.phoneNumber.trim().length > 0;
    return (hasEmail && !hasPhone) || (!hasEmail && hasPhone);
  },
  { message: 'Either email or phoneNumber must be provided, but not both' }
);

export type LoginWithOtpDto = z.infer<typeof LoginWithOtpDtoSchema>;

export interface LoginWithOtpResponse {
  verificationId: string;
  message: string;
  expiresAt: string;
}

// ============================================
// VERIFY LOGIN
// ============================================

export const VerifyLoginDtoSchema = z.object({
  verificationId: z.string().min(1, 'Verification ID is required'),
  otpCode: z.string().length(6, 'OTP must be 6 digits'),
});

export type VerifyLoginDto = z.infer<typeof VerifyLoginDtoSchema>;

export interface VerifyLoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ============================================
// LOGIN HISTORY & SESSIONS
// ============================================

export interface DeviceInfo {
  platform?: 'IOS' | 'ANDROID' | 'WEB';
  deviceId?: string;
  deviceModel?: string;
  osVersion?: string;
}

export interface LoginHistoryItem {
  id: string;
  platform: string;
  deviceId?: string | null;
  deviceModel?: string | null;
  osVersion?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  location?: string | null;
  loginMethod: string;
  status: string;
  failureReason?: string | null;
  loginAt: Date;
  refreshTokenId?: string | null;
}

export interface ActiveSession {
  id: string;
  deviceId?: string | null;
  platform?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  lastUsedAt: Date;
  createdAt: Date;
  expiresAt: Date;
  isCurrent?: boolean;
}

export interface ActiveSessionsResponse {
  sessions: ActiveSession[];
  total: number;
}

export interface PaginatedLoginHistoryResponse {
  data: LoginHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// FORCE LOGOUT
// ============================================

export const ForceLogoutDeviceDtoSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
});

export type ForceLogoutDeviceDto = z.infer<typeof ForceLogoutDeviceDtoSchema>;

export const ForceLogoutAllDtoSchema = z.object({
  excludeCurrent: z.boolean().optional().default(true),
});

export type ForceLogoutAllDto = z.infer<typeof ForceLogoutAllDtoSchema>;

