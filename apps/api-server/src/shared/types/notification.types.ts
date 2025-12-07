import { ID, Timestamps } from './common.types';

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  MARKETING = 'MARKETING',
  TRANSACTIONAL = 'TRANSACTIONAL',
  ALERT = 'ALERT',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  READ = 'READ',
}

export interface Notification extends Timestamps {
  id: ID;
  userId: ID;
  
  type: NotificationType;
  channel: NotificationChannel;
  
  title: string;
  body: string;
  data?: Record<string, any> | null;
  
  status: NotificationStatus;
  
  sentAt?: Date | null;
  readAt?: Date | null;
  
  error?: string | null;
}

export enum DevicePlatform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
}

export interface Device extends Timestamps {
  id: ID;
  userId: ID;
  fcmToken: string;
  platform: DevicePlatform;
  deviceId?: string | null;
  model?: string | null;
  osVersion?: string | null;
  isActive: boolean;
  lastUsedAt: Date;
}

