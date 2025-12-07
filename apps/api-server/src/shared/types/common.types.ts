/**
 * Common types used across Frontend and Backend
 * These types can be reused in NestJS without modification
 */

export type ID = string;

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: Record<string, any>;
}

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

