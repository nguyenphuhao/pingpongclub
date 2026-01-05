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

/**
 * Tournaments API
 */
export const tournamentsApi = {
  /**
   * List tournaments with pagination and filters
   */
  async listTournaments(params: {
    page?: number;
    limit?: number;
    status?: string;
    gameType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.status) queryParams.set('status', params.status);
    if (params.gameType) queryParams.set('gameType', params.gameType);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    const response = await apiFetch<{
      data: any[];
      meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/api/admin/tournaments?${queryParams.toString()}`);

    return response.data || { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  },

  /**
   * Get tournament by ID
   */
  async getTournamentById(id: string) {
    const response = await apiFetch(`/api/admin/tournaments/${id}`);
    return response.data;
  },

  /**
   * Create tournament
   */
  async createTournament(data: any) {
    const response = await apiFetch('/api/admin/tournaments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Update tournament
   */
  async updateTournament(id: string, data: any) {
    const response = await apiFetch(`/api/admin/tournaments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  /**
   * Delete tournament
   */
  async deleteTournament(id: string) {
    const response = await apiFetch(`/api/admin/tournaments/${id}`, {
      method: 'DELETE',
    });
    return response.data;
  },
};

/**
 * Tournament Participants API
 */
export const participantsApi = {
  async listParticipants(tournamentId: string, params?: { page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = `/api/admin/tournaments/${tournamentId}/participants${query ? `?${query}` : ''}`;

    const response = await apiFetch(url, {
      method: 'GET',
    });
    // Return the full response object with {data, meta} structure
    return response;
  },

  async addParticipant(tournamentId: string, data: { userId: string; groupId?: string; seed?: number }) {
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/participants`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  async updateParticipant(
    tournamentId: string,
    participantId: string,
    data: { groupId?: string; seed?: number; status?: string }
  ) {
    const response = await apiFetch(
      `/api/admin/tournaments/${tournamentId}/participants/${participantId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
    return response.data || response;
  },

  async removeParticipant(tournamentId: string, participantId: string) {
    const response = await apiFetch(
      `/api/admin/tournaments/${tournamentId}/participants/${participantId}`,
      {
        method: 'DELETE',
      }
    );
    return response.data;
  },

  async bulkImportParticipants(
    tournamentId: string,
    participants: Array<{ userId: string; seed?: number }>
  ) {
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/participants/bulk`, {
      method: 'POST',
      body: JSON.stringify({ participants }),
    });
    return response.data || response;
  },

  async lockParticipants(tournamentId: string) {
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/participants/lock`, {
      method: 'POST',
    });
    return response.data || response;
  },

  async unlockParticipants(tournamentId: string) {
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/participants/unlock`, {
      method: 'POST',
    });
    return response.data || response;
  },
};

/**
 * Tournament Groups API
 */
export const groupsApi = {
  async listGroups(
    tournamentId: string,
    params?: { status?: string; page?: number; limit?: number }
  ) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = `/api/admin/tournaments/${tournamentId}/groups${query ? `?${query}` : ''}`;

    const response = await apiFetch(url, { method: 'GET' });
    return response;
  },

  async createGroup(
    tournamentId: string,
    data: {
      name: string;
      displayName?: string;
      participantsPerGroup?: number;
      participantsAdvancing?: number;
    }
  ) {
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/groups`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  async updateGroup(
    tournamentId: string,
    groupId: string,
    data: {
      name?: string;
      displayName?: string;
      participantsPerGroup?: number;
      participantsAdvancing?: number;
    }
  ) {
    const response = await apiFetch(
      `/api/admin/tournaments/${tournamentId}/groups/${groupId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
    return response.data || response;
  },

  async getGroupDetails(tournamentId: string, groupId: string, includeDetails: boolean = false) {
    const query = includeDetails ? '?includeDetails=true' : '';
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/groups/${groupId}${query}`, {
      method: 'GET',
    });
    return response.data || response;
  },

  async deleteGroup(tournamentId: string, groupId: string) {
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/groups/${groupId}`, {
      method: 'DELETE',
    });
    return response.data || response;
  },

  async autoGenerateGroups(
    tournamentId: string,
    data: {
      numberOfGroups?: number;
      participantsPerGroup?: number;
      participantsAdvancing?: number;
      groupNamePrefix?: string;
    }
  ) {
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/groups/auto-generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data || response;
  },

  async getGroupStandings(tournamentId: string, groupId: string) {
    const response = await apiFetch(
      `/api/admin/tournaments/${tournamentId}/groups/${groupId}/standings`,
      {
        method: 'GET',
      }
    );
    return response.data || response;
  },
};

/**
 * Tournament Group Participants API
 */
export const groupParticipantsApi = {
  async listGroupParticipants(
    tournamentId: string,
    groupId: string,
    params?: { page?: number; limit?: number }
  ) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = `/api/admin/tournaments/${tournamentId}/groups/${groupId}/participants${query ? `?${query}` : ''}`;

    const response = await apiFetch(url, { method: 'GET' });
    return response;
  },

  async addParticipantToGroup(
    tournamentId: string,
    groupId: string,
    data: { participantId: string }
  ) {
    const response = await apiFetch(
      `/api/admin/tournaments/${tournamentId}/groups/${groupId}/participants`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response.data || response;
  },

  async removeParticipantFromGroup(
    tournamentId: string,
    groupId: string,
    participantId: string
  ) {
    const response = await apiFetch(
      `/api/admin/tournaments/${tournamentId}/groups/${groupId}/participants/${participantId}`,
      {
        method: 'DELETE',
      }
    );
    return response.data || response;
  },
};

/**
 * Tournament Bracket API
 */
export const matchesApi = {
  async listMatches(
    tournamentId: string,
    params?: {
      stage?: string;
      groupId?: string;
      status?: string;
      round?: number;
      page?: number;
      limit?: number;
    }
  ) {
    const queryParams = new URLSearchParams();
    if (params?.stage) queryParams.append('stage', params.stage);
    if (params?.groupId) queryParams.append('groupId', params.groupId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.round) queryParams.append('round', params.round.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const url = `/api/admin/tournaments/${tournamentId}/matches${query ? `?${query}` : ''}`;

    const response = await apiFetch(url, { method: 'GET' });
    return response;
  },

  async getMatch(tournamentId: string, matchId: string) {
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/matches/${matchId}`, {
      method: 'GET',
    });
    return response;
  },

  async updateMatch(tournamentId: string, matchId: string, data: any) {
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/matches/${matchId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response;
  },

  async createMatch(tournamentId: string, data: any) {
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/matches`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },

  async deleteMatch(tournamentId: string, matchId: string) {
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/matches/${matchId}`, {
      method: 'DELETE',
    });
    return response;
  },

  async getStats(tournamentId: string) {
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/matches/stats`, {
      method: 'GET',
    });
    return response;
  },

  async generateMatches(
    tournamentId: string,
    data: {
      stage: 'FINAL' | 'GROUP';
      groupId?: string;
      includeThirdPlaceMatch?: boolean;
      matchupsPerPair?: number;
    }
  ) {
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/matches/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  },

  async deleteAllMatches(tournamentId: string) {
    const response = await apiFetch(`/api/admin/tournaments/${tournamentId}/matches`, {
      method: 'DELETE',
    });
    return response;
  },
};

/**
 * Members API
 */
export const membersApi = {
  async listMembers(params?: { page?: number; limit?: number; search?: string; rank?: string; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.rank) queryParams.append('rank', params.rank);
    if (params?.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    const url = `/api/admin/members${query ? `?${query}` : ''}`;
    const response = await apiFetch(url, { method: 'GET' });

    // API returns { success: true, data: [...], meta: {...} }
    // Return the whole response so caller can access both data and meta
    return response;
  },

  async getMemberById(id: string) {
    const response = await apiFetch(`/api/admin/members/${id}`, { method: 'GET' });
    return response;
  },
};

/**
 * Generic API Client for custom endpoints
 */
export const apiClient = {
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return apiFetch<T>(endpoint, {
      method: 'GET',
    });
  },

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return apiFetch<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return apiFetch<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return apiFetch<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return apiFetch<T>(endpoint, {
      method: 'DELETE',
    });
  },
};
