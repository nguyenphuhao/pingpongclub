import { env } from '../config/env.config';

/**
 * Email Provider Interface
 * Sau này trong NestJS: wrap thành EmailService @Injectable()
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface IEmailProvider {
  send(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * Console Email Provider (for development)
 */
export class ConsoleEmailAdapter implements IEmailProvider {
  async send(options: EmailOptions) {
    console.log('📧 [EMAIL] Would send email:', {
      to: options.to,
      subject: options.subject,
      from: options.from || env.EMAIL_FROM,
    });
    console.log('Content:', options.html || options.text);
    return { success: true, messageId: 'console-' + Date.now() };
  }
}

/**
 * HTTP Email Provider (for mock server)
 * Gửi email tới mock notification server
 */
export class HttpEmailAdapter implements IEmailProvider {
  private mockServerUrl: string;

  constructor(mockServerUrl?: string) {
    this.mockServerUrl = mockServerUrl || env.MOCK_SERVER_URL || 'http://localhost:9000';
  }

  async send(options: EmailOptions) {
    try {
      const response = await fetch(`${this.mockServerUrl}/api/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: options.to,
          from: options.from || env.EMAIL_FROM,
          subject: options.subject,
          html: options.html,
          text: options.text,
          cc: options.cc,
          bcc: options.bcc,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mock server returned ${response.status}`);
      }

      const result = await response.json();
      console.log('📧 [EMAIL] Sent to mock server:', {
        to: options.to,
        subject: options.subject,
        messageId: result.messageId,
      });

      return { success: true, messageId: result.messageId };
    } catch (error: any) {
      console.error('❌ [EMAIL] Failed to send to mock server:', error.message);
      // Fallback to console if mock server is down
      console.log('📧 [EMAIL] Fallback to console:', {
        to: options.to,
        subject: options.subject,
      });
      return { success: false, error: error.message };
    }
  }
}

/**
 * Email Factory
 */
export function createEmailProvider(): IEmailProvider {
  // Development: use mock server if configured, otherwise console
  if (env.USE_MOCK_SERVER === 'true' || env.MOCK_SERVER_URL) {
    return new HttpEmailAdapter();
  }
  
  // TODO: Add SendGridEmailAdapter for production
  // if (env.NODE_ENV === 'production' && env.SENDGRID_API_KEY) {
  //   return new SendGridEmailAdapter();
  // }
  
  return new ConsoleEmailAdapter();
}

/**
 * NOTE: SendGrid adapter removed for now (package not installed)
 * To enable SendGrid in production:
 * 1. Install: yarn add @sendgrid/mail
 * 2. Add SendGridEmailAdapter class back
 * 3. Update createEmailProvider() to use it in production
 * 
 * Trong NestJS, file này sẽ trở thành:
 * 
 * @Injectable()
 * export class EmailService {
 *   private provider: IEmailProvider;
 *   
 *   constructor(private configService: ConfigService) {
 *     this.provider = createEmailProvider();
 *   }
 *   
 *   async sendEmail(options: EmailOptions) {
 *     return this.provider.send(options);
 *   }
 * }
 */

