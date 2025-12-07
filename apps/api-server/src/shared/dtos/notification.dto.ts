import { z } from 'zod';
import { NotificationType, NotificationChannel, DevicePlatform } from '../types';

/**
 * Notification DTOs
 */

// ============================================
// SEND NOTIFICATION
// ============================================

export const SendNotificationDtoSchema = z.object({
  userId: z.string().optional(), // If not provided, send to all users
  userIds: z.array(z.string()).optional(), // Send to multiple users
  
  type: z.nativeEnum(NotificationType),
  channel: z.nativeEnum(NotificationChannel),
  
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  data: z.record(z.any()).optional(),
  
  // Email specific
  from: z.string().email().optional(),
  
  // SMS specific
  phoneNumber: z.string().optional(),
  
  // Schedule
  scheduledAt: z.string().datetime().optional(),
});

export type SendNotificationDto = z.infer<typeof SendNotificationDtoSchema>;

export interface SendNotificationResponse {
  notificationId: string;
  status: 'sent' | 'scheduled' | 'failed';
  message: string;
}

// ============================================
// REGISTER DEVICE (for Push)
// ============================================

export const RegisterDeviceDtoSchema = z.object({
  fcmToken: z.string().min(1, 'FCM token is required'),
  platform: z.nativeEnum(DevicePlatform),
  deviceId: z.string().optional(),
  model: z.string().optional(),
  osVersion: z.string().optional(),
});

export type RegisterDeviceDto = z.infer<typeof RegisterDeviceDtoSchema>;

// ============================================
// MARK AS READ
// ============================================

export const MarkAsReadDtoSchema = z.object({
  notificationIds: z.array(z.string()).min(1, 'At least one notification ID is required'),
});

export type MarkAsReadDto = z.infer<typeof MarkAsReadDtoSchema>;

// ============================================
// QUERY NOTIFICATIONS
// ============================================

export const QueryNotificationsDtoSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  type: z.nativeEnum(NotificationType).optional(),
  channel: z.nativeEnum(NotificationChannel).optional(),
  unreadOnly: z.coerce.boolean().optional().default(false),
});

export type QueryNotificationsDto = z.infer<typeof QueryNotificationsDtoSchema>;

