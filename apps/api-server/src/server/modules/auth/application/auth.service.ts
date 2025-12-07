import { FirebaseAuthAdapter } from '@/server/common/adapters/firebase-admin.adapter';
import { UserRepository, userRepository } from '@/server/modules/users/infrastructure/user.repository';
import { AuthRepository, authRepository } from '../infrastructure/auth.repository';
import { JwtService, jwtService } from './jwt.service';
import { OtpService, otpService } from './otp.service';
import { LoginHistoryService, loginHistoryService, DeviceInfo, RequestInfo } from './login-history.service';
import { LoginMethod } from '../domain/login-history.entity';
import { UserEntity } from '@/server/modules/users/domain/user.entity';
import { 
  FirebaseAuthDto, 
  FirebaseAuthResponse,
  RefreshTokenDto,
  RefreshTokenResponse,
  RegisterWithOtpDto,
  RegisterWithOtpResponse,
  VerifyRegistrationDto,
  VerifyRegistrationResponse,
  LoginWithOtpDto,
  LoginWithOtpResponse,
  VerifyLoginDto,
  VerifyLoginResponse,
  LoginDto,
  LoginResponse,
} from '@/shared/dtos';
import { 
  InvalidCredentialsException,
  InvalidTokenException,
  UnauthorizedException,
  ValidationException,
  NotFoundException,
} from '@/server/common/exceptions';
import { UserRole, UserStatus } from '@/shared/types';
import { hashPassword, verifyPassword } from '@dokifree/auth';

/**
 * Auth Service (Application Layer)
 * Business logic cho authentication & authorization
 * KHÔNG phụ thuộc Next.js - framework agnostic
 * Sau này trong NestJS: wrap với @Injectable()
 */

export class AuthService {
  private firebaseAuth: FirebaseAuthAdapter;

  constructor(
    private userRepository: UserRepository,
    private authRepository: AuthRepository,
    private jwtService: JwtService,
    private otpService: OtpService,
    private loginHistoryService: LoginHistoryService,
  ) {
    this.firebaseAuth = new FirebaseAuthAdapter();
  }

  /**
   * Authenticate with Firebase ID Token
   * Tự động tạo user mới nếu chưa tồn tại
   */
  async authenticateWithFirebase(
    dto: FirebaseAuthDto,
    deviceInfo?: DeviceInfo,
    requestInfo?: RequestInfo
  ): Promise<FirebaseAuthResponse> {
    // Verify Firebase token
    const decodedToken = await this.firebaseAuth.verifyIdToken(dto.idToken);
    
    // Extract provider from token (google.com, facebook.com, password, etc.)
    const provider = this.firebaseAuth.getProviderFromToken(decodedToken);
    
    // Find or create user
    let user = await this.userRepository.findByFirebaseUid(decodedToken.uid);
    let isNewUser = false;

    if (!user) {
      // Create new user from Firebase data
      const firebaseUser = await this.firebaseAuth.getUserByUid(decodedToken.uid);
      
      user = await this.userRepository.create({
        email: firebaseUser.email!,
        firebaseUid: decodedToken.uid,
        provider: provider || undefined,
        firstName: firebaseUser.displayName?.split(' ')[0],
        lastName: firebaseUser.displayName?.split(' ').slice(1).join(' '),
        phone: firebaseUser.phoneNumber || undefined,
        avatar: firebaseUser.photoURL || undefined,
        role: UserRole.USER,
      });

      // Update email verified status
      if (firebaseUser.emailVerified) {
        await this.userRepository.update(user.id, { emailVerified: true });
        user.emailVerified = true;
      }

      isNewUser = true;
    } else {
      // Update provider if not set (for existing users)
      if (!user.provider && provider) {
        await this.userRepository.update(user.id, { provider });
        user.provider = provider;
      }
      
      // Update avatar if available and different
      const firebaseUser = await this.firebaseAuth.getUserByUid(decodedToken.uid);
      if (firebaseUser.photoURL && firebaseUser.photoURL !== user.avatar) {
        await this.userRepository.update(user.id, { avatar: firebaseUser.photoURL });
        user.avatar = firebaseUser.photoURL;
      }
    }

    // Check if user can login
    if (!user.isActive()) {
      throw new UnauthorizedException('User account is not active');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    // Generate tokens với device info
    const accessToken = this.jwtService.generateAccessToken(user);
    const refreshTokenRecord = await this.authRepository.createRefreshToken({
      userId: user.id,
      deviceId: deviceInfo?.deviceId,
      platform: deviceInfo?.platform,
      ipAddress: requestInfo?.ipAddress,
      userAgent: requestInfo?.userAgent,
    });

    // Record login history
    await this.loginHistoryService.recordLogin(
      user.id,
      LoginMethod.FIREBASE,
      deviceInfo,
      requestInfo,
      refreshTokenRecord.id
    );

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken: refreshTokenRecord.token,
      isNewUser,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(dto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    // Verify refresh token
    const refreshTokenRecord = await this.authRepository.verifyRefreshToken(dto.refreshToken);

    if (!refreshTokenRecord) {
      throw new InvalidTokenException('Invalid or expired refresh token');
    }

    // Update last used timestamp
    await this.authRepository.updateLastUsed(dto.refreshToken);

    // Get user
    const user = new UserEntity(refreshTokenRecord.user);

    if (!user.isActive()) {
      throw new UnauthorizedException('User account is not active');
    }

    // Generate new access token
    const accessToken = this.jwtService.generateAccessToken(user);

    // Optionally: rotate refresh token (create new one and delete old)
    // For now, keep the same refresh token
    const newRefreshToken = refreshTokenRecord.token;

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.jwtService.getTokenExpiresIn(),
    };
  }

  /**
   * Logout (invalidate refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    await this.authRepository.deleteRefreshToken(refreshToken);
  }

  /**
   * Logout from all devices (invalidate all refresh tokens)
   */
  async logoutAll(userId: string): Promise<void> {
    await this.authRepository.deleteAllRefreshTokensForUser(userId);
  }

  /**
   * Force logout một device cụ thể
   */
  async forceLogoutDevice(userId: string, deviceId: string): Promise<void> {
    const deletedCount = await this.authRepository.deleteRefreshTokenByDeviceId(
      userId,
      deviceId
    );
    
    if (deletedCount === 0) {
      throw new NotFoundException('Device session not found');
    }
  }

  /**
   * Force logout một session cụ thể (theo refresh token ID)
   */
  async forceLogoutSession(userId: string, refreshTokenId: string): Promise<void> {
    // Verify token belongs to user
    const token = await this.authRepository.findRefreshTokenById(refreshTokenId);
    
    if (!token) {
      throw new NotFoundException('Session not found');
    }
    
    if (token.userId !== userId) {
      throw new UnauthorizedException('Cannot logout other user\'s session');
    }
    
    await this.authRepository.deleteRefreshTokenById(refreshTokenId);
  }

  /**
   * Force logout tất cả devices (trừ device hiện tại nếu excludeCurrent = true)
   */
  async forceLogoutAllDevices(
    userId: string,
    currentRefreshToken?: string
  ): Promise<number> {
    if (currentRefreshToken) {
      // Get current token để exclude
      const currentToken = await this.authRepository.findRefreshToken(currentRefreshToken);
      
      if (currentToken && currentToken.deviceId) {
        // Logout tất cả trừ device hiện tại
        return await this.authRepository.deleteAllRefreshTokensExceptDevice(
          userId,
          currentToken.deviceId
        );
      } else if (currentToken) {
        // Logout tất cả trừ token hiện tại
        return await this.authRepository.deleteAllRefreshTokensExcept(
          userId,
          currentToken.id
        );
      }
    }
    
    // Logout tất cả (bao gồm cả current)
    await this.authRepository.deleteAllRefreshTokensForUser(userId);
    const allTokens = await this.authRepository.getUserRefreshTokens(userId);
    return allTokens.length;
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string) {
    const tokens = await this.authRepository.getUserRefreshTokens(userId);
    
    return tokens.map((token) => ({
      id: token.id,
      deviceId: token.deviceId,
      platform: token.platform,
      ipAddress: token.ipAddress,
      userAgent: token.userAgent,
      lastUsedAt: token.lastUsedAt,
      createdAt: token.createdAt,
      expiresAt: token.expiresAt,
      isCurrent: false, // Will be set by caller if needed
    }));
  }

  /**
   * Verify access token and get user
   */
  async verifyAccessToken(token: string): Promise<UserEntity> {
    const payload = this.jwtService.verifyAccessToken(token);
    
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new InvalidTokenException('User not found');
    }

    if (!user.isActive()) {
      throw new UnauthorizedException('User account is not active');
    }

    return user;
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(token: string): Promise<UserEntity> {
    return await this.verifyAccessToken(token);
  }

  /**
   * Set password for user (for admin or user themselves)
   */
  async setPassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await hashPassword(newPassword);
    await this.userRepository.updatePassword(userId, hashedPassword);
  }

  /**
   * Change password (requires old password verification)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has password set
    if (!user.password) {
      throw new ValidationException('No password set. Please set a password first.');
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new InvalidCredentialsException('Current password is incorrect');
    }

    // Hash and update new password
    const hashedPassword = await hashPassword(newPassword);
    await this.userRepository.updatePassword(userId, hashedPassword);
  }

  /**
   * Register with OTP - Send OTP code
   */
  async registerWithOtp(dto: RegisterWithOtpDto): Promise<RegisterWithOtpResponse> {
    // Determine identifier and type - ensure we have a valid value
    console.log('🔍 [DEBUG] registerWithOtp - Raw DTO:', JSON.stringify(dto));
    console.log('🔍 [DEBUG] registerWithOtp - DTO values:', { 
      email: dto.email, 
      emailType: typeof dto.email,
      phoneNumber: dto.phoneNumber,
      phoneNumberType: typeof dto.phoneNumber 
    });
    
    // Check if email exists and is not empty
    const hasEmail = dto.email && typeof dto.email === 'string' && dto.email.trim().length > 0;
    const hasPhone = dto.phoneNumber && typeof dto.phoneNumber === 'string' && dto.phoneNumber.trim().length > 0;

    console.log('🔍 [DEBUG] registerWithOtp - Checks:', { hasEmail, hasPhone });

    if (!hasEmail && !hasPhone) {
      throw new ValidationException('Either email or phoneNumber is required');
    }

    if (hasEmail && hasPhone) {
      throw new ValidationException('Either email or phoneNumber must be provided, but not both');
    }

    const identifier = hasEmail ? dto.email! : dto.phoneNumber!;
    const identifierType = hasEmail ? 'EMAIL' : 'PHONE';

    console.log('🔍 [DEBUG] registerWithOtp - Final:', { identifier, identifierType });

    // Check if user already exists
    const existingUser = dto.email
      ? await this.userRepository.findByEmail(dto.email)
      : await this.userRepository.findByPhone(dto.phoneNumber!);

    if (existingUser) {
      throw new ValidationException(
        `User with this ${identifierType.toLowerCase()} already exists`
      );
    }

    console.log('🔍 [DEBUG] Calling createOtpVerification with:', { identifier, identifierType, purpose: 'REGISTRATION' });

    // Create OTP verification
    const { verificationId, otpCode, expiresAt } = 
      await this.otpService.createOtpVerification(
        identifier,
        identifierType,
        'REGISTRATION'
      );

    // Send OTP
    if (identifierType === 'EMAIL') {
      await this.otpService.sendOtpViaEmail(identifier, otpCode, 'REGISTRATION', verificationId);
    } else {
      await this.otpService.sendOtpViaSms(identifier, otpCode, 'REGISTRATION', verificationId);
    }

    return {
      verificationId,
      message: `OTP sent to your ${identifierType.toLowerCase()}`,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Verify registration OTP and create user
   */
  async verifyRegistration(dto: VerifyRegistrationDto): Promise<VerifyRegistrationResponse> {
    // Verify OTP
    const { identifier, identifierType, purpose } = 
      await this.otpService.verifyOtpCode(dto.verificationId, dto.otpCode);

    if (purpose !== 'REGISTRATION') {
      throw new ValidationException('Invalid verification purpose');
    }

    // Check if user already exists
    const existingUser = identifierType === 'EMAIL'
      ? await this.userRepository.findByEmail(identifier)
      : await this.userRepository.findByPhone(identifier);

    if (existingUser) {
      throw new ValidationException('User already exists');
    }

    // Create new user
    const userData = identifierType === 'EMAIL'
      ? {
          email: identifier,
          emailVerified: true, // Auto-verify since OTP verified
          provider: 'phone', // OTP registration
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
        }
      : {
          email: `${identifier}@temp.dokifree.com`, // Temp email for phone-only users
          phone: identifier,
          phoneVerified: true, // Auto-verify since OTP verified
          provider: 'phone', // OTP registration
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
        };

    await this.userRepository.create(userData);

    return {
      message: 'Registration successful',
      email: identifierType === 'EMAIL' ? identifier : undefined,
      phoneNumber: identifierType === 'PHONE' ? identifier : undefined,
    };
  }

  /**
   * Login with OTP - Send OTP code
   */
  async loginWithOtp(dto: LoginWithOtpDto): Promise<LoginWithOtpResponse> {
    // Determine identifier and type - ensure we have a valid value
    // Check if email exists and is not empty
    const hasEmail = dto.email && dto.email.trim().length > 0;
    const hasPhone = dto.phoneNumber && dto.phoneNumber.trim().length > 0;

    if (!hasEmail && !hasPhone) {
      throw new ValidationException('Either email or phoneNumber is required');
    }

    if (hasEmail && hasPhone) {
      throw new ValidationException('Either email or phoneNumber must be provided, but not both');
    }

    const identifier = hasEmail ? dto.email! : dto.phoneNumber!;
    const identifierType = hasEmail ? 'EMAIL' : 'PHONE';

    // Check if user exists
    const user = dto.email
      ? await this.userRepository.findByEmail(dto.email)
      : await this.userRepository.findByPhone(dto.phoneNumber!);

    if (!user) {
      throw new NotFoundException(
        `No account found with this ${identifierType.toLowerCase()}`
      );
    }

    // Check if user is active
    if (!user.isActive()) {
      throw new UnauthorizedException('Account is not active');
    }

    // Create OTP verification
    const { verificationId, otpCode, expiresAt } = 
      await this.otpService.createOtpVerification(
        identifier,
        identifierType,
        'LOGIN'
      );

    // Send OTP
    if (identifierType === 'EMAIL') {
      await this.otpService.sendOtpViaEmail(identifier, otpCode, 'LOGIN', verificationId);
    } else {
      await this.otpService.sendOtpViaSms(identifier, otpCode, 'LOGIN', verificationId);
    }

    return {
      verificationId,
      message: `OTP sent to your ${identifierType.toLowerCase()}`,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Verify login OTP and return tokens
   */
  async verifyLogin(
    dto: VerifyLoginDto,
    deviceInfo?: DeviceInfo,
    requestInfo?: RequestInfo
  ): Promise<VerifyLoginResponse> {
    // Verify OTP
    const { identifier, identifierType, purpose } = 
      await this.otpService.verifyOtpCode(dto.verificationId, dto.otpCode);

    if (purpose !== 'LOGIN') {
      throw new ValidationException('Invalid verification purpose');
    }

    // Get user
    const user = identifierType === 'EMAIL'
      ? await this.userRepository.findByEmail(identifier)
      : await this.userRepository.findByPhone(identifier);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is active
    if (!user.isActive()) {
      throw new UnauthorizedException('Account is not active');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    // Generate tokens với device info
    const accessToken = this.jwtService.generateAccessToken(user);
    const refreshTokenRecord = await this.authRepository.createRefreshToken({
      userId: user.id,
      deviceId: deviceInfo?.deviceId,
      platform: deviceInfo?.platform,
      ipAddress: requestInfo?.ipAddress,
      userAgent: requestInfo?.userAgent,
    });

    // Record login history
    const loginMethod = identifierType === 'EMAIL' ? LoginMethod.OTP_EMAIL : LoginMethod.OTP_PHONE;
    await this.loginHistoryService.recordLogin(
      user.id,
      loginMethod,
      deviceInfo,
      requestInfo,
      refreshTokenRecord.id
    );

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken: refreshTokenRecord.token,
    };
  }

  /**
   * Login with email or phone + password
   */
  async loginWithPassword(
    dto: LoginDto,
    deviceInfo?: DeviceInfo,
    requestInfo?: RequestInfo
  ): Promise<LoginResponse> {
    // Determine identifier and type
    const hasEmail = dto.email && dto.email.trim().length > 0;
    const hasPhone = dto.phoneNumber && dto.phoneNumber.trim().length > 0;

    if (!hasEmail && !hasPhone) {
      throw new ValidationException('Either email or phoneNumber is required');
    }

    if (hasEmail && hasPhone) {
      throw new ValidationException('Either email or phoneNumber must be provided, but not both');
    }

    const identifier = hasEmail ? dto.email! : dto.phoneNumber!;
    const identifierType = hasEmail ? 'EMAIL' : 'PHONE';

    // Find user by email or phone
    const user = hasEmail
      ? await this.userRepository.findByEmail(identifier)
      : await this.userRepository.findByPhone(identifier);

    if (!user) {
      throw new InvalidCredentialsException('Invalid email/phone or password');
    }

    // Check if user has password set
    if (!user.password) {
      throw new InvalidCredentialsException('Password not set for this account. Please use OTP login.');
    }

    // Verify password
    const isValidPassword = await verifyPassword(dto.password, user.password);
    if (!isValidPassword) {
      // Record failed login attempt
      await this.loginHistoryService.recordLogin(
        user.id,
        identifierType === 'EMAIL' ? LoginMethod.PASSWORD_EMAIL : LoginMethod.PASSWORD_PHONE,
        deviceInfo,
        requestInfo,
        undefined, // no refreshTokenId
        LoginStatus.FAILED,
        'Invalid password'
      );
      throw new InvalidCredentialsException('Invalid email/phone or password');
    }

    // Check if user is active
    if (!user.isActive()) {
      throw new UnauthorizedException('Account is not active');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    // Generate tokens với device info
    const accessToken = this.jwtService.generateAccessToken(user);
    const refreshTokenRecord = await this.authRepository.createRefreshToken({
      userId: user.id,
      deviceId: deviceInfo?.deviceId,
      platform: deviceInfo?.platform,
      ipAddress: requestInfo?.ipAddress,
      userAgent: requestInfo?.userAgent,
    });

    // Record login history
    const loginMethod = identifierType === 'EMAIL' ? LoginMethod.PASSWORD_EMAIL : LoginMethod.PASSWORD_PHONE;
    await this.loginHistoryService.recordLogin(
      user.id,
      loginMethod,
      deviceInfo,
      requestInfo,
      refreshTokenRecord.id
    );

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken: refreshTokenRecord.token,
      expiresIn: this.jwtService.getTokenExpiresIn(),
    };
  }
}

/**
 * Singleton instance
 */
export const authService = new AuthService(
  userRepository,
  authRepository,
  jwtService,
  otpService,
  loginHistoryService,
);

/**
 * Trong NestJS:
 * 
 * @Injectable()
 * export class AuthService {
 *   constructor(
 *     private userRepository: UserRepository,
 *     private authRepository: AuthRepository,
 *     private jwtService: JwtService,
 *     private firebaseService: FirebaseAdminService,
 *   ) {}
 *   
 *   async authenticateWithFirebase(dto: FirebaseAuthDto) {
 *     const decodedToken = await this.firebaseService
 *       .getAuth()
 *       .verifyIdToken(dto.idToken);
 *     
 *     // ... rest of logic
 *   }
 *   
 *   // ... other methods
 * }
 */

