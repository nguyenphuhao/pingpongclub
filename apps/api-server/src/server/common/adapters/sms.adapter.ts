import { env } from '../config/env.config';

/**
 * SMS Provider Interface
 * Sau này trong NestJS: wrap thành SmsService @Injectable()
 */

export interface SmsOptions {
  to: string;
  message: string;
  from?: string;
}

export interface ISmsProvider {
  send(options: SmsOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * Console SMS Provider (for development)
 */
export class ConsoleSmsAdapter implements ISmsProvider {
  async send(options: SmsOptions) {
    console.log('📱 [SMS] Would send SMS:', {
      to: options.to,
      from: options.from || env.TWILIO_PHONE_NUMBER,
    });
    console.log('Message:', options.message);
    return { success: true, messageId: 'console-' + Date.now() };
  }
}

/**
 * HTTP SMS Provider (for mock server)
 * Gửi SMS tới mock notification server
 */
export class HttpSmsAdapter implements ISmsProvider {
  private mockServerUrl: string;

  constructor(mockServerUrl?: string) {
    this.mockServerUrl = mockServerUrl || env.MOCK_SERVER_URL || 'http://localhost:9000';
  }

  async send(options: SmsOptions) {
    try {
      const response = await fetch(`${this.mockServerUrl}/api/sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: options.to,
          from: options.from || env.TWILIO_PHONE_NUMBER,
          message: options.message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mock server returned ${response.status}`);
      }

      const result = await response.json();
      console.log('📱 [SMS] Sent to mock server:', {
        to: options.to,
        messageId: result.messageId,
      });

      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      console.error('❌ [SMS] Failed to send to mock server:', error.message);
      // Fallback to console if mock server is down
      console.log('📱 [SMS] Fallback to console:', {
        to: options.to,
        message: options.message.substring(0, 50),
      });
      return { success: false, error: error.message };
    }
  }
}

/**
 * SMS Factory
 */
export function createSmsProvider(): ISmsProvider {
  // Development: use mock server if configured, otherwise console
  if (env.USE_MOCK_SERVER === 'true' || env.MOCK_SERVER_URL) {
    return new HttpSmsAdapter();
  }
  
  // TODO: Add TwilioSmsAdapter for production
  // if (env.NODE_ENV === 'production' && env.TWILIO_ACCOUNT_SID) {
  //   return new TwilioSmsAdapter();
  // }
  
  return new ConsoleSmsAdapter();
}

/**
 * NOTE: Twilio adapter removed for now (package not installed)
 * To enable Twilio in production:
 * 1. Install: yarn add twilio
 * 2. Add TwilioSmsAdapter class back
 * 3. Update createSmsProvider() to use it in production
 * 
 * Trong NestJS:
 * 
 * @Injectable()
 * export class SmsService {
 *   private provider: ISmsProvider;
 *   
 *   constructor(private configService: ConfigService) {
 *     this.provider = createSmsProvider();
 *   }
 *   
 *   async sendSms(options: SmsOptions) {
 *     return this.provider.send(options);
 *   }
 * }
 */

