import { prisma } from '@pingclub/database';
import { IRepository } from '@/server/common/interfaces/repository.interface';
import { PaginationParams, PaginatedResponse, UserRole, UserStatus } from '@/shared/types';
import { UserEntity } from '../domain/user.entity';
import { CreateUserDto, UpdateUserDto } from '@/shared/dtos';

/**
 * User Repository
 * Chịu trách nhiệm tương tác với database
 * Sau này trong NestJS: wrap với @Injectable() và inject PrismaService
 */

export interface UserQueryOptions {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  includeDeleted?: boolean;
}

export class UserRepository implements IRepository<UserEntity> {
  /**
   * Find by ID
   */
  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    return user ? new UserEntity(user) : null;
  }

  /**
   * Find by email
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user ? new UserEntity(user) : null;
  }

  /**
   * Find by phone number
   */
  async findByPhone(phone: string): Promise<UserEntity | null> {
    // Validate phone is not empty/undefined
    if (!phone || phone.trim() === '') {
      return null;
    }
    
    const user = await prisma.user.findUnique({
      where: { phone },
    });
    return user ? new UserEntity(user) : null;
  }

  /**
   * Find by Firebase UID
   */
  async findByFirebaseUid(firebaseUid: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
    });
    return user ? new UserEntity(user) : null;
  }

  /**
   * Find all with pagination and filters
   */
  async findAll(
    params?: PaginationParams & UserQueryOptions,
  ): Promise<PaginatedResponse<UserEntity>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by role
    if (params?.role) {
      where.role = params.role;
    }

    // Filter by status
    if (params?.status) {
      where.status = params.status;
    }

    // Exclude deleted by default
    if (!params?.includeDeleted) {
      where.deletedAt = null;
    }

    // Search by email or name
    if (params?.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [params?.orderBy || 'createdAt']: params?.order || 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const data = users.map((user) => new UserEntity(user));
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Create user
   */
  async create(data: CreateUserDto): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        firebaseUid: data.firebaseUid,
        provider: data.provider,
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar,
        role: data.role || UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    });
    return new UserEntity(user);
  }

  /**
   * Update user
   */
  async update(id: string, data: Partial<UpdateUserDto>): Promise<UserEntity> {
    const user = await prisma.user.update({
      where: { id },
      data,
    });
    return new UserEntity(user);
  }

  /**
   * Soft delete
   */
  async delete(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        status: UserStatus.DELETED,
      },
    });
  }

  /**
   * Hard delete
   */
  async hardDelete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Update last login
   */
  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  /**
   * Check if email exists
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email },
    });
    return count > 0;
  }

  /**
   * Check if phone exists
   */
  async existsByPhone(phone: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { phone },
    });
    return count > 0;
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  /**
   * Check if user has password set
   */
  async hasPassword(id: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { password: true },
    });
    return user?.password !== null && user?.password !== undefined;
  }
}

/**
 * Singleton instance
 * Sau này trong NestJS: inject qua constructor
 */
export const userRepository = new UserRepository();

/**
 * Trong NestJS:
 * 
 * @Injectable()
 * export class UserRepository {
 *   constructor(private prisma: PrismaService) {}
 *   
 *   async findById(id: string) {
 *     const user = await this.prisma.user.findUnique({ where: { id } });
 *     return user ? new UserEntity(user) : null;
 *   }
 *   
 *   // ... other methods
 * }
 */

