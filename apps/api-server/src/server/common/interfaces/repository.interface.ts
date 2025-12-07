import { PaginationParams, PaginatedResponse } from '@/shared/types';

/**
 * Generic Repository Interface
 * Sau này trong NestJS: có thể extend thêm hoặc dùng TypeORM Repository
 */

export interface IRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(params?: PaginationParams): Promise<PaginatedResponse<T>>;
  create(data: Partial<T>): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
}

/**
 * Query options
 */
export interface QueryOptions {
  skip?: number;
  take?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  where?: Record<string, any>;
  include?: Record<string, boolean | object>;
}

/**
 * Trong NestJS với TypeORM:
 * - Repository<T> from TypeORM
 * - InjectRepository() decorator
 * 
 * Trong NestJS với Prisma:
 * - PrismaService inject vào constructor
 * - Methods tương tự nhưng dùng this.prisma.model.xxx()
 */

