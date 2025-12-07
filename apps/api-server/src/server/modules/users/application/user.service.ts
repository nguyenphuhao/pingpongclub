import { UserRepository, userRepository } from '../infrastructure/user.repository';
import { UserEntity } from '../domain/user.entity';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  QueryUsersDto,
  UpdateUserStatusDto,
  UpdateUserRoleDto 
} from '@/shared/dtos';
import { 
  UserNotFoundException, 
  UserAlreadyExistsException,
  ForbiddenException,
} from '@/server/common/exceptions';
import { PaginatedResponse, UserRole } from '@/shared/types';

/**
 * User Service (Application Layer)
 * Chứa business logic, use cases
 * KHÔNG phụ thuộc vào Next.js, hoàn toàn framework-agnostic
 * Sau này trong NestJS: wrap với @Injectable()
 */

export class UserService {
  constructor(private repository: UserRepository) {}

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserEntity> {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new UserNotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserEntity | null> {
    return await this.repository.findByEmail(email);
  }

  /**
   * Get user by Firebase UID
   */
  async getUserByFirebaseUid(firebaseUid: string): Promise<UserEntity | null> {
    return await this.repository.findByFirebaseUid(firebaseUid);
  }

  /**
   * List users with pagination and filters
   */
  async listUsers(query: QueryUsersDto): Promise<PaginatedResponse<UserEntity>> {
    return await this.repository.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      role: query.role,
      status: query.status,
      orderBy: query.orderBy,
      order: query.order,
    });
  }

  /**
   * Create new user
   */
  async createUser(data: CreateUserDto): Promise<UserEntity> {
    // Check if email already exists
    const existingUser = await this.repository.findByEmail(data.email);
    if (existingUser) {
      throw new UserAlreadyExistsException(`User with email ${data.email} already exists`);
    }

    // Check if phone already exists (if provided)
    if (data.phone) {
      const existingPhone = await this.repository.findByPhone(data.phone);
      if (existingPhone) {
        throw new UserAlreadyExistsException(`User with phone ${data.phone} already exists`);
      }
    }

    // Create user
    const user = await this.repository.create(data);
    return user;
  }

  /**
   * Update user profile
   */
  async updateUser(id: string, data: UpdateUserDto): Promise<UserEntity> {
    // Check if user exists
    const user = await this.getUserById(id);

    // Check if phone is being changed and already exists
    if (data.phone && data.phone !== user.phone) {
      const existingPhone = await this.repository.findByPhone(data.phone);
      if (existingPhone && existingPhone.id !== id) {
        throw new UserAlreadyExistsException(`Phone ${data.phone} is already in use`);
      }
    }

    return await this.repository.update(id, data);
  }

  /**
   * Update user status (Admin only)
   */
  async updateUserStatus(
    id: string, 
    data: UpdateUserStatusDto,
    currentUser: UserEntity,
  ): Promise<UserEntity> {
    // Check permission
    if (!currentUser.isAdmin()) {
      throw new ForbiddenException('Only admins can update user status');
    }

    const user = await this.getUserById(id);

    // Prevent self-deactivation
    if (user.id === currentUser.id) {
      throw new ForbiddenException('Cannot change your own status');
    }

    return await this.repository.update(id, { status: data.status });
  }

  /**
   * Update user role (Admin only)
   */
  async updateUserRole(
    id: string,
    data: UpdateUserRoleDto,
    currentUser: UserEntity,
  ): Promise<UserEntity> {
    // Check permission
    if (!currentUser.isAdmin()) {
      throw new ForbiddenException('Only admins can update user roles');
    }

    const user = await this.getUserById(id);

    // Prevent self-role change
    if (user.id === currentUser.id) {
      throw new ForbiddenException('Cannot change your own role');
    }

    return await this.repository.update(id, { role: data.role });
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: string, currentUser: UserEntity): Promise<void> {
    // Check permission
    if (!currentUser.isAdmin()) {
      throw new ForbiddenException('Only admins can delete users');
    }

    const user = await this.getUserById(id);

    // Prevent self-deletion
    if (user.id === currentUser.id) {
      throw new ForbiddenException('Cannot delete yourself');
    }

    await this.repository.delete(id);
  }

  /**
   * Get user profile (public)
   */
  async getUserProfile(id: string) {
    const user = await this.getUserById(id);
    return user.toPublicProfile();
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await this.repository.updateLastLogin(id);
  }

  /**
   * Update user status (Admin only - bypass permission check)
   * Used by admin service when admin is updating user status
   */
  async updateUserStatusByAdmin(
    id: string,
    data: UpdateUserStatusDto,
  ): Promise<UserEntity> {
    const user = await this.getUserById(id);
    return await this.repository.update(id, { status: data.status });
  }

  /**
   * Update user role (Admin only - bypass permission check)
   * Used by admin service when admin is updating user role
   */
  async updateUserRoleByAdmin(
    id: string,
    data: UpdateUserRoleDto,
  ): Promise<UserEntity> {
    const user = await this.getUserById(id);
    return await this.repository.update(id, { role: data.role });
  }
}

/**
 * Singleton instance
 * Sau này trong NestJS: inject qua constructor
 */
export const userService = new UserService(userRepository);

/**
 * Trong NestJS:
 * 
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     private userRepository: UserRepository,
 *     // có thể inject thêm các service khác
 *   ) {}
 *   
 *   async getUserById(id: string): Promise<UserEntity> {
 *     const user = await this.userRepository.findById(id);
 *     if (!user) {
 *       throw new NotFoundException('User not found');
 *     }
 *     return user;
 *   }
 *   
 *   // ... other methods
 * }
 */

