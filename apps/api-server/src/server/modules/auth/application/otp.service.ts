import { prisma } from '@pingclub/database';
import { 
  createEmailProvider, 
  createSmsProvider 
} from '@/server/common/adapters';
import { NotFoundException, ValidationException } from '@/server/common/exceptions';

/**
 * OTP Service (Application Layer)
 * Quản lý OTP generation, validation, sending
 * Framework-agnostic - sau này wrap với @Injectable()
 */

type OtpPurpose = 'REGISTRATION' | 'LOGIN';
type OtpIdentifierType = 'EMAIL' | 'PHONE';

export class OtpService {
  private emailProvider = createEmailProvider();
  private smsProvider = createSmsProvider();
  
  // OTP config
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 5;

  /**
   * Generate random OTP code
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create OTP verification record
   */
  async createOtpVerification(
    identifier: string,
    identifierType: OtpIdentifierType,
    purpose: OtpPurpose,
  ): Promise<{ verificationId: string; otpCode: string; expiresAt: Date }> {
    console.log('🔍 [OTP DEBUG] Received params:', { identifier, identifierType, purpose });
    
    const otpCode = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate previous OTP codes for same identifier + purpose
    await prisma.otpVerification.updateMany({
      where: {
        identifier,
        purpose,
        verified: false,
      },
      data: {
        expiresAt: new Date(), // Expire immediately
      },
    });

    console.log('🔍 [OTP DEBUG] Creating with data:', { identifier, identifierType, otpCode, purpose, expiresAt });

    // Create new OTP verification
    const verification = await prisma.otpVerification.create({
      data: {
        identifier,
        identifierType,
        otpCode,
        purpose,
        expiresAt,
      },
    });

    return {
      verificationId: verification.id,
      otpCode,
      expiresAt,
    };
  }

  /**
   * Send OTP via Email
   */
  async sendOtpViaEmail(email: string, otpCode: string, purpose: OtpPurpose, verificationId?: string) {
    const subject = purpose === 'REGISTRATION' 
      ? 'Mã xác thực đăng ký tài khoản'
      : 'Mã xác thực đăng nhập';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${subject}</h2>
        <p style="color: #666; font-size: 16px;">Mã OTP của bạn là:</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #4F46E5; font-size: 32px; letter-spacing: 8px; margin: 0;">${otpCode}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">Mã này sẽ hết hạn sau ${this.OTP_EXPIRY_MINUTES} phút.</p>
        ${verificationId ? `
        <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #92400E; font-size: 12px; margin: 0;"><strong>🔑 Verification ID:</strong></p>
          <p style="color: #92400E; font-size: 11px; font-family: monospace; margin: 5px 0 0 0;">${verificationId}</p>
        </div>
        ` : ''}
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          <small>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</small>
        </p>
      </div>
    `;

    return await this.emailProvider.send({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send OTP via SMS
   */
  async sendOtpViaSms(phoneNumber: string, otpCode: string, purpose: OtpPurpose, verificationId?: string) {
    const baseMessage = purpose === 'REGISTRATION'
      ? `Ma xac thuc dang ky DokiFree: ${otpCode}. Ma co hieu luc trong ${this.OTP_EXPIRY_MINUTES} phut.`
      : `Ma xac thuc dang nhap DokiFree: ${otpCode}. Ma co hieu luc trong ${this.OTP_EXPIRY_MINUTES} phut.`;
    
    const message = verificationId 
      ? `${baseMessage}\nVerification ID: ${verificationId}`
      : baseMessage;

    return await this.smsProvider.send({
      to: phoneNumber,
      message,
    });
  }

  /**
   * Verify OTP code
   */
  async verifyOtpCode(verificationId: string, otpCode: string): Promise<{
    identifier: string;
    identifierType: OtpIdentifierType;
    purpose: OtpPurpose;
  }> {
    const verification = await prisma.otpVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    // Check if already verified
    if (verification.verified) {
      throw new ValidationException('OTP already used');
    }

    // Check if expired
    if (verification.expiresAt < new Date()) {
      throw new ValidationException('OTP expired');
    }

    // Check max attempts
    if (verification.attempts >= this.MAX_ATTEMPTS) {
      throw new ValidationException('Too many failed attempts');
    }

    // Verify OTP code
    if (verification.otpCode !== otpCode) {
      // Increment attempts
      await prisma.otpVerification.update({
        where: { id: verificationId },
        data: { attempts: verification.attempts + 1 },
      });

      throw new ValidationException('Invalid OTP code');
    }

    // Mark as verified
    await prisma.otpVerification.update({
      where: { id: verificationId },
      data: {
        verified: true,
        verifiedAt: new Date(),
      },
    });

    return {
      identifier: verification.identifier,
      identifierType: verification.identifierType as OtpIdentifierType,
      purpose: verification.purpose as OtpPurpose,
    };
  }

  /**
   * Check if verification is already used
   */
  async isVerificationUsed(verificationId: string): Promise<boolean> {
    const verification = await prisma.otpVerification.findUnique({
      where: { id: verificationId },
    });

    return verification?.verified || false;
  }
}

/**
 * Singleton instance
 */
export const otpService = new OtpService();

/**
 * Trong NestJS:
 * 
 * @Injectable()
 * export class OtpService {
 *   constructor(
 *     private prismaService: PrismaService,
 *     private emailProvider: EmailProvider,
 *     private smsProvider: SmsProvider,
 *   ) {}
 *   
 *   async createOtpVerification(...) { ... }
 *   async verifyOtpCode(...) { ... }
 * }
 */

