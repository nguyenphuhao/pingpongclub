'use server';

import { usersApiV2 as usersApi } from '@/lib/api-client-v2';
import { UserRole, UserStatus } from '@pingclub/database';
import { revalidatePath } from 'next/cache';

export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface UserListResult {
  data: any[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getUsers(params: UserListParams = {}): Promise<UserListResult> {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    status,
    orderBy = 'createdAt',
    order = 'desc',
  } = params;

  try {
    const result = await usersApi.listUsers({
      page,
      limit,
      search,
      role: role as string | undefined,
      status: status as string | undefined,
      orderBy,
      order,
    });

    const meta = result.meta || {
      page,
      limit,
      total: 0,
      totalPages: 0,
    };

    return {
      data: result.data || [],
      meta: {
        page: meta.page ?? page,
        limit: meta.limit ?? limit,
        total: meta.total ?? 0,
        totalPages: meta.totalPages ?? 0,
      },
    };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    throw new Error(error.message || 'Failed to fetch users');
  }
}

export async function getUserById(id: string) {
  try {
    const user = await usersApi.getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error: any) {
    console.error('Error fetching user:', error);
    throw new Error(error.message || 'Failed to fetch user');
  }
}

export interface CreateUserData {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: UserRole;
  password?: string;
}

export async function createUser(data: CreateUserData) {
  try {
    const user = await usersApi.createUser({
      email: data.email,
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      // Note: avatar is not in CreateUserDto, can be updated later via updateUser
      role: data.role as 'USER' | 'ADMIN' | 'MODERATOR' | undefined,
      password: data.password,
    });

    revalidatePath('/users');
    return user;
  } catch (error: any) {
    console.error('Error creating user:', error);
    throw new Error(error.message || 'Failed to create user');
  }
}

export async function updateUserStatus(id: string, status: UserStatus) {
  try {
    const user = await usersApi.updateUserStatus(id, status);
    revalidatePath('/users');
    revalidatePath(`/users/${id}`);
    return user;
  } catch (error: any) {
    console.error('Error updating user status:', error);
    throw new Error(error.message || 'Failed to update user status');
  }
}

export interface UpdateUserData {
  phone?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role?: UserRole;
}

export async function updateUser(id: string, data: UpdateUserData) {
  try {
    const user = await usersApi.updateUser(id, {
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      avatar: data.avatar,
    });

    // If role is being updated, use admin endpoint
    if (data.role) {
      await usersApi.updateUserRole(id, data.role as string);
      // Fetch updated user
      const updatedUser = await usersApi.getUserById(id);
      revalidatePath('/users');
      revalidatePath(`/users/${id}`);
      return updatedUser;
    }

    revalidatePath('/users');
    revalidatePath(`/users/${id}`);
    return user;
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw new Error(error.message || 'Failed to update user');
  }
}

export async function deleteUser(id: string) {
  try {
    await usersApi.deleteUser(id);
    revalidatePath('/users');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new Error(error.message || 'Failed to delete user');
  }
}

export async function getLoginHistory(userId: string, limit: number = 50) {
  try {
    const result = await usersApi.getUserLoginHistory(userId, {
      page: 1,
      limit,
    });
    return result.data || [];
  } catch (error: any) {
    console.error('Error fetching login history:', error);
    throw new Error(error.message || 'Failed to fetch login history');
  }
}

export async function getActiveSessions(userId: string) {
  try {
    const sessions = await usersApi.getUserActiveSessions(userId);
    return sessions;
  } catch (error: any) {
    console.error('Error fetching active sessions:', error);
    throw new Error(error.message || 'Failed to fetch active sessions');
  }
}

export async function forceLogoutSession(userId: string, tokenId: string) {
  try {
    await usersApi.forceLogoutSession(userId, tokenId);
    revalidatePath('/users');
    revalidatePath(`/users/${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error force logging out session:', error);
    throw new Error(error.message || 'Failed to logout session');
  }
}

export async function forceLogoutAllSessions(userId: string) {
  try {
    const result = await usersApi.forceLogoutAllSessions(userId);
    revalidatePath('/users');
    revalidatePath(`/users/${userId}`);
    return { success: true, count: result.loggedOutCount || 0 };
  } catch (error: any) {
    console.error('Error force logging out all sessions:', error);
    throw new Error(error.message || 'Failed to logout all sessions');
  }
}

