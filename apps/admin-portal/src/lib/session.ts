import { cookies } from 'next/headers';

export interface SessionData {
  id: string;
  username: string;
  role: string;
}

/**
 * Get current admin user from API (Server-side)
 * Reads JWT token from cookies and calls API
 */
export async function getCurrentAdmin() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('admin_token');
    
    if (!tokenCookie?.value) {
      return null;
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${API_BASE_URL}/api/admin/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenCookie.value}`,
      },
      cache: 'no-store', // Don't cache auth requests
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('Error getting current admin:', error);
    return null;
  }
}

