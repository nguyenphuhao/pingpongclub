/**
 * API Client for Backend API
 * Centralized API client to call BE endpoints
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: any;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get admin auth token from cookie or localStorage
 */
function getAdminToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Try to get from localStorage first (for client-side)
  const token = localStorage.getItem('admin_token');
  if (token) {
    return token;
  }

  // Try to get from cookie (for SSR)
  const cookies = document.cookie.split(';');
  const adminTokenCookie = cookies.find((c) => c.trim().startsWith('admin_token='));
  if (adminTokenCookie) {
    return adminTokenCookie.split('=')[1];
  }

  return null;
}

/**
 * Set admin auth token
 * Sets both localStorage (for client-side) and cookie (for SSR)
 */
export function setAdminToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
    // Set cookie for SSR compatibility with proper attributes
    // HttpOnly cannot be set from client-side, but we'll set it server-side if needed
    const maxAge = 7 * 24 * 60 * 60; // 7 days
    document.cookie = `admin_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;
  }
}

/**
 * Remove admin auth token
 */
export function removeAdminToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
    document.cookie = 'admin_token=; path=/; max-age=0';
  }
}

/**
 * Base fetch wrapper with error handling
 */
async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getAdminToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check if response is ok before parsing JSON
    let data: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parsing fails, use text response
        const text = await response.text();
        throw new ApiError(
          text || 'Invalid response format',
          response.status,
          { raw: text },
        );
      }
    } else {
      const text = await response.text();
      throw new ApiError(
        text || 'Invalid response format',
        response.status,
        { raw: text },
      );
    }

    if (!response.ok) {
      // Extract error message from response structure
      const errorMessage = 
        data.error?.message || 
        (typeof data.error === 'string' ? data.error : null) ||
        data.message || 
        'Request failed';
      
      throw new ApiError(
        errorMessage,
        response.status,
        data,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors (CORS, connection refused, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        `Cannot connect to API server. Please check if the server is running at ${API_BASE_URL}`,
        0,
        { originalError: error.message },
      );
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0,
      { originalError: error },
    );
  }
}

/**
 * Admin Auth API
 */
export const adminAuthApi = {
  /**
   * Admin login
   */
  async login(username: string, password: string) {
    try {
      const response = await apiFetch<{
        admin: any;
        accessToken: string;
        expiresIn: number;
      }>('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (response.data?.accessToken) {
        setAdminToken(response.data.accessToken);
      }

      return response.data;
    } catch (error: any) {
      // Re-throw with better error message
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error.message || 'Login failed. Please check your credentials.',
        error.status || 0,
      );
    }
  },

  /**
   * Get current admin user
   */
  async getCurrentAdmin() {
    const response = await apiFetch<{
      id: string;
      username: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
      role: string;
      status: string;
    }>('/api/admin/auth/me');

    return response.data || null;
  },

  /**
   * Admin logout
   */
  logout() {
    removeAdminToken();
  },
};

/**
 * Users API
 */
export const usersApi = {
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
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.role) queryParams.set('role', params.role);
    if (params.status) queryParams.set('status', params.status);
    if (params.orderBy) queryParams.set('orderBy', params.orderBy);
    if (params.order) queryParams.set('order', params.order);

    const response = await apiFetch<{
      data: any[];
      meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/api/users?${queryParams.toString()}`);

    return response.data || { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
  },

  /**
   * Get user by ID
   */
  async getUserById(id: string) {
    const response = await apiFetch(`/api/users/${id}`);
    return response.data;
  },

  /**
   * Create user
   */
  async createUser(data: {
    email: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    role?: string;
    password?: string;
  }) {
    const response = await apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Update user
   */
  async updateUser(id: string, data: {
    phone?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }) {
    const response = await apiFetch(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Delete user
   */
  async deleteUser(id: string) {
    const response = await apiFetch(`/api/users/${id}`, {
      method: 'DELETE',
    });
    return response.data;
  },

  /**
   * Update user status (Admin only)
   */
  async updateUserStatus(id: string, status: string) {
    const response = await apiFetch(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.data;
  },

  /**
   * Update user role (Admin only)
   */
  async updateUserRole(id: string, role: string) {
    const response = await apiFetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return response.data;
  },

  /**
   * Get user login history (Admin only)
   */
  async getUserLoginHistory(id: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const response = await apiFetch<{
      data: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/admin/users/${id}/login-history?${queryParams.toString()}`);

    return response.data || { data: [], total: 0, page: 1, limit: 50, totalPages: 0 };
  },

  /**
   * Get user active sessions (Admin only)
   */
  async getUserActiveSessions(id: string) {
    const response = await apiFetch<{
      sessions: any[];
      total: number;
    }>(`/api/admin/users/${id}/sessions`);

    return response.data?.sessions || [];
  },

  /**
   * Force logout user session (Admin only)
   */
  async forceLogoutSession(userId: string, sessionId: string) {
    const response = await apiFetch(`/api/admin/users/${userId}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    return response.data;
  },

  /**
   * Force logout all user sessions (Admin only)
   */
  async forceLogoutAllSessions(userId: string) {
    const response = await apiFetch(`/api/admin/users/${userId}/sessions`, {
      method: 'DELETE',
    });
    return response.data;
  },
};

/**
 * Dashboard API
 */
export const dashboardApi = {
  /**
   * Get dashboard statistics
   */
  async getStats() {
    const response = await apiFetch<{
      totalUsers: number;
      newUsers24h: number;
      activeNow: number;
    }>('/api/admin/dashboard/stats');

    return response.data || { totalUsers: 0, newUsers24h: 0, activeNow: 0 };
  },

  /**
   * Get recent users
   */
  async getRecentUsers(limit: number = 5) {
    const queryParams = new URLSearchParams();
    queryParams.set('limit', limit.toString());

    const response = await apiFetch<any[]>(`/api/admin/dashboard/recent-users?${queryParams.toString()}`);

    return response.data || [];
  },
};

