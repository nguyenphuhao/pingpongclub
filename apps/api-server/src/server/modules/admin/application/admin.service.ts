import { AdminRepository, adminRepository } from '../infrastructure/admin.repository';
import { JwtService, jwtService } from '@/server/modules/auth/application/jwt.service';
import { userService } from '@/server/modules/users/application/user.service';
import { loginHistoryService } from '@/server/modules/auth/application/login-history.service';
import { authService } from '@/server/modules/auth/application/auth.service';
import { verifyPassword } from '@dokifree/auth';
import { 
  InvalidCredentialsException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@/server/common/exceptions';
import { AdminRole, AdminStatus } from '@dokifree/database';
import { UpdateUserStatusDto, UpdateUserRoleDto } from '@/shared/dtos';
import { UserEntity } from '@/server/modules/users/domain/user.entity';

/**
 * Admin Service (Application Layer)
 * Business logic cho admin operations
 */

export interface AdminEntity {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  avatar: string | null;
  role: AdminRole;
  status: AdminStatus;
}

export interface AdminLoginResponse {
  admin: AdminEntity;
  accessToken: string;
  expiresIn: number;
}

export class AdminService {
  constructor(
    private repository: AdminRepository,
    private jwtService: JwtService,
  ) {}

  /**
   * Authenticate admin with username and password
   */
  async login(username: string, password: string): Promise<AdminLoginResponse> {
    // Find admin
    const admin = await this.repository.findByUsername(username);
    
    if (!admin) {
      throw new InvalidCredentialsException('Invalid username or password');
    }

    // Check if admin is active
    if (admin.status !== AdminStatus.ACTIVE || admin.deletedAt) {
      throw new UnauthorizedException('Admin account is not active');
    }

    // Verify password
    const passwordHash = await this.repository.getPasswordHash(admin.id);
    if (!passwordHash) {
      throw new InvalidCredentialsException('Invalid username or password');
    }

    const isValidPassword = await verifyPassword(password, passwordHash);
    if (!isValidPassword) {
      throw new InvalidCredentialsException('Invalid username or password');
    }

    // Update last login
    await this.repository.updateLastLogin(admin.id);

    // Generate JWT token
    const accessToken = this.jwtService.generateToken({
      sub: admin.id,
      email: admin.email || admin.username,
      role: `ADMIN_${admin.role}`,
    });

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        avatar: admin.avatar,
        role: admin.role,
        status: admin.status,
      },
      accessToken,
      expiresIn: this.jwtService.getTokenExpiresIn(),
    };
  }

  /**
   * Verify admin token and get admin entity
   */
  async verifyAdminToken(token: string): Promise<AdminEntity> {
    const payload = this.jwtService.verifyAccessToken(token);
    
    // Check if token is for admin (role starts with ADMIN_)
    if (!payload.role?.startsWith('ADMIN_')) {
      throw new UnauthorizedException('Invalid admin token');
    }

    const admin = await this.repository.findById(payload.sub);
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    if (!await this.repository.isActive(admin.id)) {
      throw new UnauthorizedException('Admin account is not active');
    }

    return admin;
  }

  /**
   * Update user status (Admin only)
   */
  async updateUserStatus(
    userId: string,
    data: UpdateUserStatusDto,
    adminId: string,
  ): Promise<UserEntity> {
    // Verify admin exists and is active
    const admin = await this.repository.findById(adminId);
    if (!admin || admin.status !== AdminStatus.ACTIVE || admin.deletedAt) {
      throw new UnauthorizedException('Admin not found or inactive');
    }

    // Check permission - only ADMIN role can update status
    if (admin.role !== AdminRole.ADMIN) {
      throw new ForbiddenException('Only admins can update user status');
    }

    // Get user
    const user = await userService.getUserById(userId);

    // Prevent self-deactivation if admin is also a user
    // (This is a safety check, though admin and user are separate models)

    // Update user status
    return await userService.updateUserStatusByAdmin(userId, data);
  }

  /**
   * Update user role (Admin only)
   */
  async updateUserRole(
    userId: string,
    data: UpdateUserRoleDto,
    adminId: string,
  ): Promise<UserEntity> {
    // Verify admin exists and is active
    const admin = await this.repository.findById(adminId);
    if (!admin || admin.status !== AdminStatus.ACTIVE || admin.deletedAt) {
      throw new UnauthorizedException('Admin not found or inactive');
    }

    // Check permission - only ADMIN role can update roles
    if (admin.role !== AdminRole.ADMIN) {
      throw new ForbiddenException('Only admins can update user roles');
    }

    // Get user
    const user = await userService.getUserById(userId);

    // Update user role
    return await userService.updateUserRoleByAdmin(userId, data);
  }

  /**
   * Get user login history (Admin only)
   */
  async getUserLoginHistory(
    userId: string,
    adminId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    // Verify admin exists and is active
    const admin = await this.repository.findById(adminId);
    if (!admin || admin.status !== AdminStatus.ACTIVE || admin.deletedAt) {
      throw new UnauthorizedException('Admin not found or inactive');
    }

    // Verify user exists
    await userService.getUserById(userId);

    // Get login history
    return await loginHistoryService.getUserLoginHistory(userId, page, limit);
  }

  /**
   * Get user active sessions (Admin only)
   */
  async getUserActiveSessions(userId: string, adminId: string) {
    // Verify admin exists and is active
    const admin = await this.repository.findById(adminId);
    if (!admin || admin.status !== AdminStatus.ACTIVE || admin.deletedAt) {
      throw new UnauthorizedException('Admin not found or inactive');
    }

    // Verify user exists
    await userService.getUserById(userId);

    // Get active sessions
    return await authService.getActiveSessions(userId);
  }

  /**
   * Force logout user session (Admin only)
   */
  async forceLogoutUserSession(
    userId: string,
    refreshTokenId: string,
    adminId: string,
  ): Promise<void> {
    // Verify admin exists and is active
    const admin = await this.repository.findById(adminId);
    if (!admin || admin.status !== AdminStatus.ACTIVE || admin.deletedAt) {
      throw new UnauthorizedException('Admin not found or inactive');
    }

    // Verify user exists
    await userService.getUserById(userId);

    // Force logout session
    await authService.forceLogoutSession(userId, refreshTokenId);
  }

  /**
   * Force logout all user sessions (Admin only)
   */
  async forceLogoutAllUserSessions(
    userId: string,
    adminId: string,
  ): Promise<number> {
    // Verify admin exists and is active
    const admin = await this.repository.findById(adminId);
    if (!admin || admin.status !== AdminStatus.ACTIVE || admin.deletedAt) {
      throw new UnauthorizedException('Admin not found or inactive');
    }

    // Verify user exists
    await userService.getUserById(userId);

    // Force logout all sessions
    await authService.logoutAll(userId);
    const sessions = await authService.getActiveSessions(userId);
    return sessions.length;
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(adminId: string) {
    // Verify admin exists and is active
    const admin = await this.repository.findById(adminId);
    if (!admin || admin.status !== AdminStatus.ACTIVE || admin.deletedAt) {
      throw new UnauthorizedException('Admin not found or inactive');
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    const { prisma } = await import('@/server/common/database/prisma.client');

    // Total users (not deleted)
    const totalUsers = await prisma.user.count({
      where: {
        deletedAt: null,
      },
    });

    // New users in last 24 hours
    const newUsers24h = await prisma.user.count({
      where: {
        createdAt: {
          gte: last24Hours,
        },
        deletedAt: null,
      },
    });

    // Active now (users logged in within last hour)
    const activeNow = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: lastHour,
        },
        deletedAt: null,
        status: 'ACTIVE',
      },
    });

    return {
      totalUsers,
      newUsers24h,
      activeNow,
    };
  }

  /**
   * Get recent users
   */
  async getRecentUsers(adminId: string, limit: number = 5) {
    // Verify admin exists and is active
    const admin = await this.repository.findById(adminId);
    if (!admin || admin.status !== AdminStatus.ACTIVE || admin.deletedAt) {
      throw new UnauthorizedException('Admin not found or inactive');
    }

    const { prisma } = await import('@/server/common/database/prisma.client');

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
        role: true,
        status: true,
      },
    });

    return users;
  }
}

/**
 * Singleton instance
 */
export const adminService = new AdminService(adminRepository, jwtService);

