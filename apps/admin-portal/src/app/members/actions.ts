'use server';

/**
 * Server Actions for Members Management
 */

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface GetMembersParams {
  page?: number;
  limit?: number;
  search?: string;
  rank?: string;
  status?: string;
  gender?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

async function getAdminToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    return token?.value || null;
  } catch (error) {
    console.error('Error reading admin token:', error);
    return null;
  }
}

async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = await getAdminToken();
  
  if (!token) {
    throw new Error('Unauthorized - No admin token found');
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function getMembers(params: GetMembersParams = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.rank && params.rank !== 'all') queryParams.set('rank', params.rank);
    if (params.status && params.status !== 'all') queryParams.set('status', params.status);
    if (params.gender && params.gender !== 'all') queryParams.set('gender', params.gender);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    const response = await authenticatedFetch(`/api/admin/members?${queryParams.toString()}`);
    
    // Response structure: { success: true, data: [...], meta: {...} }
    return {
      data: response.data || [],
      pagination: response.meta || {
        page: params.page || 1,
        limit: params.limit || 20,
        total: 0,
        totalPages: 0,
      },
    };
  } catch (error: any) {
    console.error('Error fetching members:', error);
    throw new Error(error.message || 'Failed to fetch members');
  }
}

export async function getMemberById(id: string) {
  try {
    const response = await authenticatedFetch(`/api/admin/members/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching member:', error);
    throw new Error(error.message || 'Failed to fetch member');
  }
}

export async function updateMember(id: string, data: any) {
  try {
    const token = await getAdminToken();
    if (!token) {
      throw new Error('Unauthorized');
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/members/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Update failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    // Revalidate cache
    revalidatePath('/members');
    revalidatePath(`/members/${id}`);
    
    return result.data;
  } catch (error: any) {
    console.error('Error updating member:', error);
    throw new Error(error.message || 'Failed to update member');
  }
}

export async function deleteMember(id: string) {
  try {
    const token = await getAdminToken();
    if (!token) {
      throw new Error('Unauthorized');
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/members/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delete failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    // Revalidate cache
    revalidatePath('/members');
    
    return result.data;
  } catch (error: any) {
    console.error('Error deleting member:', error);
    throw new Error(error.message || 'Failed to delete member');
  }
}

export async function getMemberStatistics() {
  try {
    const response = await authenticatedFetch(`/api/admin/members/statistics`);
    // Response structure: { success: true, data: {...} }
    return response.data || {
      totalMembers: 0,
      activeMembers: 0,
      newMembersThisMonth: 0,
      averageRating: 1000,
    };
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    // Return default stats on error instead of throwing
    return {
      totalMembers: 0,
      activeMembers: 0,
      newMembersThisMonth: 0,
      averageRating: 1000,
    };
  }
}

export interface CreateMemberData {
  displayName: string;      // Required
  nickname?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  initialRating?: number;   // Default 1000
  startedPlayingAt?: string; // Default today
  tags?: string[];
  playStyle?: string;
  bio?: string;
}

export async function createMember(data: CreateMemberData) {
  try {
    const token = await getAdminToken();
    if (!token) {
      throw new Error('Unauthorized');
    }

    // Generate temp email if not provided (required by API)
    const memberData = {
      displayName: data.displayName,
      nickname: data.nickname || data.displayName.toLowerCase().replace(/\s+/g, ''),
      email: data.email || `temp-${Date.now()}@pingclub.local`,
      phone: data.phone,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      ratingPoints: data.initialRating || 1000,
      initialRating: data.initialRating || 1000,
      startedPlayingAt: data.startedPlayingAt || new Date().toISOString(),
      tags: data.tags || [],
      playStyle: data.playStyle,
      bio: data.bio,
    };

    const response = await fetch(`${API_BASE_URL}/api/admin/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(memberData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Create failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    // Revalidate cache
    revalidatePath('/members');
    
    return result.data;
  } catch (error: any) {
    console.error('Error creating member:', error);
    throw new Error(error.message || 'Failed to create member');
  }
}
