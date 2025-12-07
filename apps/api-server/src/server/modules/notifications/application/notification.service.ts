import { prisma } from '@dokifree/database';
import { 
  FirebaseMessagingAdapter,
  createEmailProvider,
  createSmsProvider,
} from '@/server/common/adapters';
import { 
  SendNotificationDto,
  RegisterDeviceDto,
} from '@/shared/dtos';
import { 
  NotificationChannel,
  NotificationStatus,
  DevicePlatform,
} from '@/shared/types';

/**
 * Notification Service
 * Quản lý gửi notifications qua email, SMS, push
 * Sau này trong NestJS: wrap với @Injectable() và có thể dùng Bull Queue
 */

export class NotificationService {
  private fcm: FirebaseMessagingAdapter;
  private emailProvider = createEmailProvider();
  private smsProvider = createSmsProvider();

  constructor() {
    this.fcm = new FirebaseMessagingAdapter();
  }

  /**
   * Send notification
   */
  async sendNotification(dto: SendNotificationDto, userId?: string) {
    const targetUserId = dto.userId || userId;

    if (!targetUserId && !dto.userIds) {
      throw new Error('Either userId or userIds must be provided');
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId!,
        type: dto.type,
        channel: dto.channel,
        title: dto.title,
        body: dto.body,
        data: dto.data || {},
        status: NotificationStatus.PENDING,
      },
    });

    // Send based on channel
    try {
      let result;

      switch (dto.channel) {
        case NotificationChannel.EMAIL:
          result = await this.sendEmail(targetUserId!, dto);
          break;

        case NotificationChannel.SMS:
          result = await this.sendSms(targetUserId!, dto);
          break;

        case NotificationChannel.PUSH:
          result = await this.sendPush(targetUserId!, dto);
          break;

        case NotificationChannel.IN_APP:
          // In-app notification just creates the record
          result = { success: true };
          break;

        default:
          throw new Error(`Unsupported channel: ${dto.channel}`);
      }

      // Update notification status
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: result.success ? NotificationStatus.SENT : NotificationStatus.FAILED,
          sentAt: result.success ? new Date() : undefined,
          error: result.success ? undefined : result.error,
        },
      });

      return {
        notificationId: notification.id,
        status: result.success ? 'sent' : 'failed',
        message: result.success ? 'Notification sent' : result.error || 'Failed to send',
      };
    } catch (error: any) {
      // Update notification as failed
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.FAILED,
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(userId: string, dto: SendNotificationDto) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.email) {
      return { success: false, error: 'User email not found' };
    }

    return await this.emailProvider.send({
      to: user.email,
      subject: dto.title,
      html: dto.body,
      from: dto.from,
    });
  }

  /**
   * Send SMS notification
   */
  private async sendSms(userId: string, dto: SendNotificationDto) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.phone) {
      return { success: false, error: 'User phone not found' };
    }

    return await this.smsProvider.send({
      to: user.phone,
      message: `${dto.title}\n\n${dto.body}`,
    });
  }

  /**
   * Send push notification
   */
  private async sendPush(userId: string, dto: SendNotificationDto) {
    // Get user's active devices
    const devices = await prisma.device.findMany({
      where: { userId, isActive: true },
    });

    if (devices.length === 0) {
      return { success: false, error: 'No active devices found' };
    }

    const tokens = devices.map(d => d.fcmToken);

    return await this.fcm.sendToMultipleDevices(
      tokens,
      { title: dto.title, body: dto.body },
      dto.data as Record<string, string>,
    );
  }

  /**
   * Register device for push notifications
   */
  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    // Check if device already exists
    const existing = await prisma.device.findUnique({
      where: { fcmToken: dto.fcmToken },
    });

    if (existing) {
      // Update existing device
      return await prisma.device.update({
        where: { id: existing.id },
        data: {
          userId,
          platform: dto.platform,
          deviceId: dto.deviceId,
          model: dto.model,
          osVersion: dto.osVersion,
          isActive: true,
          lastUsedAt: new Date(),
        },
      });
    }

    // Create new device
    return await prisma.device.create({
      data: {
        userId,
        fcmToken: dto.fcmToken,
        platform: dto.platform,
        deviceId: dto.deviceId,
        model: dto.model,
        osVersion: dto.osVersion,
      },
    });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    return await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]) {
    return await prisma.notification.updateMany({
      where: { id: { in: notificationIds } },
      data: { readAt: new Date(), status: NotificationStatus.READ },
    });
  }
}

/**
 * Singleton instance
 */
export const notificationService = new NotificationService();

/**
 * Trong NestJS với Queue (Bull):
 * 
 * @Injectable()
 * export class NotificationService {
 *   constructor(
 *     @InjectQueue('notifications') private notifQueue: Queue,
 *     private emailProvider: EmailProvider,
 *     private smsProvider: SmsProvider,
 *     private fcmService: FirebaseMessagingAdapter,
 *   ) {}
 *   
 *   async sendNotification(dto: SendNotificationDto) {
 *     // Add to queue instead of processing immediately
 *     await this.notifQueue.add('send', dto, {
 *       attempts: 3,
 *       backoff: { type: 'exponential', delay: 2000 },
 *     });
 *   }
 * }
 * 
 * @Processor('notifications')
 * export class NotificationProcessor {
 *   @Process('send')
 *   async handleSend(job: Job<SendNotificationDto>) {
 *     // Process notification sending here
 *   }
 * }
 */

