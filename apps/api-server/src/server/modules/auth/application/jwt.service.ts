import jwt from 'jsonwebtoken';
import { env } from '@/server/common/config/env.config';
import { InvalidTokenException, TokenExpiredException } from '@/server/common/exceptions';
import { UserEntity } from '@/server/modules/users/domain/user.entity';

/**
 * JWT Service
 * Tạo và verify JWT tokens
 * Sau này trong NestJS: dùng @nestjs/jwt JwtService
 */

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export class JwtService {
  private secret: string;
  private expiresIn: string;

  constructor() {
    this.secret = env.JWT_SECRET;
    this.expiresIn = env.JWT_EXPIRES_IN;
  }

  /**
   * Generate access token
   */
  generateAccessToken(user: UserEntity): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    });
  }

  /**
   * Generate token with custom payload (for admin, etc.)
   */
  generateToken(payload: { sub: string; email: string; role: string }): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    });
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, this.secret) as JwtPayload;
      return payload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new TokenExpiredException('Access token has expired');
      }
      throw new InvalidTokenException('Invalid access token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Get token expiration time (in seconds)
   */
  getTokenExpiresIn(): number {
    // Parse expiresIn string (e.g., "7d", "24h", "3600s")
    const match = this.expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) return 7 * 24 * 60 * 60; // default 7 days

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 'd': return num * 24 * 60 * 60;
      case 'h': return num * 60 * 60;
      case 'm': return num * 60;
      case 's': return num;
      default: return 7 * 24 * 60 * 60;
    }
  }
}

/**
 * Singleton instance
 */
export const jwtService = new JwtService();

/**
 * Trong NestJS:
 * 
 * // Install: yarn add @nestjs/jwt
 * 
 * // app.module.ts
 * JwtModule.register({
 *   secret: process.env.JWT_SECRET,
 *   signOptions: { expiresIn: '7d' },
 * })
 * 
 * // auth.service.ts
 * @Injectable()
 * export class AuthService {
 *   constructor(private jwtService: JwtService) {}
 *   
 *   generateAccessToken(user: UserEntity) {
 *     const payload = { sub: user.id, email: user.email, role: user.role };
 *     return this.jwtService.sign(payload);
 *   }
 *   
 *   verifyAccessToken(token: string) {
 *     return this.jwtService.verify(token);
 *   }
 * }
 */

