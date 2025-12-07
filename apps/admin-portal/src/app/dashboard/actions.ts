'use server';

import { dashboardApiV2 as dashboardApi } from '@/lib/api-client-v2';

export interface DashboardStats {
  totalUsers: number;
  newUsers24h: number;
  activeNow: number; // Users logged in within last hour
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const stats = await dashboardApi.getStats();
    return {
      totalUsers: stats.totalUsers || 0,
      newUsers24h: stats.newUsers24h || 0,
      activeNow: stats.activeNow || 0,
    };
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error(error.message || 'Failed to fetch dashboard stats');
  }
}

export async function getRecentUsers(limit: number = 5) {
  try {
    const users = await dashboardApi.getRecentUsers(limit);
    return users;
  } catch (error: any) {
    console.error('Error fetching recent users:', error);
    throw new Error(error.message || 'Failed to fetch recent users');
  }
}

