/**
 * API Client V2 - Using Generated Client
 * 
 * This is a wrapper around the auto-generated API client
 * that provides a cleaner API matching the existing manual client interface
 */

// Use server-side API client for server actions
import { serverApi as generatedApi } from './api-client-server';
import type { 
  UserResponse,
  PaginatedUserResponse,
  CreateUserDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UpdateUserRoleDto,
  PaginatedLoginHistoryResponse,
  ActiveSessionsResponse,
  HttpResponse,
} from './generated/api-client';

/**
 * Helper to extract data from generated API response
 * The generated client already unwraps { success: true, data: ... } and returns data.data
 * So we just need to handle null/undefined cases
 */
async function extractData<T>(promise: Promise<any>): Promise<T> {
  try {
    const response = await promise;
    
    // Handle null/undefined response
    // The generated client already unwraps the response, so response is already the data
    if (response === null || response === undefined) {
      console.warn('[extractData] Received null/undefined response');
      return null as T;
    }
    
    // The generated client already unwraps, so return as-is
    return response as T;
  } catch (error) {
    console.error('[extractData] Error extracting data:', error);
    throw error;
  }
}

/**
 * Users API using Generated Client
 */
export const usersApiV2 = {
  /**
   * List users with pagination and filters
   */
  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    orderBy?: string;
    order?: 'asc' | 'desc';
  }) {
    const response = await generatedApi.api.usersList(params);
    const data = await extractData<PaginatedUserResponse>(response);
    
    // Handle null/undefined data
    if (!data) {
      return {
        data: [],
        meta: {
          page: params.page || 1,
          limit: params.limit || 10,
          total: 0,
          totalPages: 0,
        },
      };
    }
    
    // Transform to match existing format
    return {
      data: data.data || [],
      meta: data.meta || {
        page: params.page || 1,
        limit: params.limit || 10,
        total: 0,
        totalPages: 0,
      },
    };
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const response = await generatedApi.api.usersDetail({ id });
    const data = await extractData<UserResponse>(response);
    
    // Handle null/undefined data
    if (!data) {
      throw new Error('User not found');
    }
    
    return data.data || data;
  },

  /**
   * Create user
   */
  async createUser(data: CreateUserDto) {
    const response = await generatedApi.api.usersCreate(data);
    const result = await extractData<UserResponse>(response);
    
    // Handle null/undefined result
    if (!result) {
      throw new Error('Failed to create user');
    }
    
    return result.data || result;
  },

  /**
   * Update user
   */
  async updateUser(id: string, data: UpdateUserDto) {
    const response = await generatedApi.api.usersPartialUpdate({ id }, data);
    const result = await extractData<UserResponse>(response);
    
    // Handle null/undefined result
    if (!result) {
      throw new Error('Failed to update user');
    }
    
    return result.data || result;
  },

  /**
   * Delete user
   */
  async deleteUser(id: string) {
    await generatedApi.api.usersDelete({ id });
    return { success: true };
  },

  /**
   * Update user status (Admin only)
   */
  async updateUserStatus(id: string, status: string) {
    const response = await generatedApi.api.adminUsersStatusPartialUpdate(
      { id },
      { status } as UpdateUserStatusDto
    );
    const result = await extractData<UserResponse>(response);
    
    // Handle null/undefined result
    if (!result) {
      throw new Error('Failed to update user status');
    }
    
    return result.data || result;
  },

  /**
   * Update user role (Admin only)
   */
  async updateUserRole(id: string, role: string) {
    const response = await generatedApi.api.adminUsersRolePartialUpdate(
      { id },
      { role } as UpdateUserRoleDto
    );
    const result = await extractData<UserResponse>(response);
    
    // Handle null/undefined result
    if (!result) {
      throw new Error('Failed to update user role');
    }
    
    return result.data || result;
  },

  /**
   * Get user login history (Admin only)
   */
  async getUserLoginHistory(id: string, params?: { page?: number; limit?: number }) {
    const response = await generatedApi.api.adminUsersLoginHistoryList({
      id,
      page: params?.page || 1,
      limit: params?.limit || 50,
    });
    const result = await extractData<PaginatedLoginHistoryResponse>(response);
    
    // Handle null/undefined result
    if (!result) {
      return {
        data: [],
        total: 0,
        page: params?.page || 1,
        limit: params?.limit || 50,
        totalPages: 0,
      };
    }
    
    return {
      data: result.data || [],
      total: result.total ?? 0,
      page: result.page ?? (params?.page || 1),
      limit: result.limit ?? (params?.limit || 50),
      totalPages: result.totalPages ?? 0,
    };
  },

  /**
   * Get user active sessions (Admin only)
   */
  async getUserActiveSessions(id: string) {
    const response = await generatedApi.api.adminUsersSessionsList({ id });
    const result = await extractData<ActiveSessionsResponse>(response);
    
    // Handle null/undefined result
    if (!result) {
      return [];
    }
    
    return result.sessions || [];
  },

  /**
   * Force logout user session (Admin only)
   */
  async forceLogoutSession(userId: string, sessionId: string) {
    await generatedApi.api.adminUsersSessionsDelete({ id: userId, sessionId });
    return { success: true };
  },

  /**
   * Force logout all user sessions (Admin only)
   */
  async forceLogoutAllSessions(userId: string) {
    const response = await generatedApi.api.adminUsersSessionsDelete({ id: userId });
    const result = await extractData(response);
    return {
      success: true,
      loggedOutCount: result.loggedOutCount || 0,
    };
  },
};

/**
 * Dashboard API using Generated Client
 */
export const dashboardApiV2 = {
  /**
   * Get dashboard statistics
   */
  async getStats() {
    const response = await generatedApi.api.adminDashboardStatsList();
    const result = await extractData<{
      totalUsers: number;
      newUsers24h: number;
      activeNow: number;
    }>(response);
    
    // Handle null/undefined result
    if (!result) {
      return {
        totalUsers: 0,
        newUsers24h: 0,
        activeNow: 0,
      };
    }
    
    return {
      totalUsers: result.totalUsers ?? 0,
      newUsers24h: result.newUsers24h ?? 0,
      activeNow: result.activeNow ?? 0,
    };
  },

  /**
   * Get recent users
   */
  async getRecentUsers(limit: number = 5) {
    try {
      console.log('[DEBUG] Calling adminDashboardRecentUsersList with limit:', limit);
      const response = await generatedApi.api.adminDashboardRecentUsersList({ limit });
      console.log('[DEBUG] Response received:', typeof response);
      const result = await extractData<any>(response);
      console.log('[DEBUG] Extracted result:', typeof result, Array.isArray(result));
      
      // Handle null/undefined result
      if (!result) {
        console.warn('[DEBUG] Result is null/undefined, returning empty array');
        return [];
      }
      
      // Handle different response formats
      if (Array.isArray(result)) {
        return result;
      }
      
      if (result && typeof result === 'object' && 'data' in result && Array.isArray(result.data)) {
        return result.data;
      }
      
      return [];
    } catch (error: any) {
      console.error('[DEBUG] Error in getRecentUsers:', error);
      throw error;
    }
  },
};

/**
 * Admin Auth API using Generated Client
 */
export const adminAuthApiV2 = {
  /**
   * Admin login
   */
  async login(username: string, password: string) {
    const response = await generatedApi.api.adminAuthLoginCreate({
      username,
      password,
    });
    const result = await extractData(response);
    
    // Set token if available
    if (result.accessToken) {
      const { setAdminToken } = await import('./api-client');
      setAdminToken(result.accessToken);
    }
    
    return result;
  },
};

