/**
 * Server-side API Client
 * 
 * This version is for use in Server Actions and Server Components
 * It reads auth token from cookies instead of localStorage
 */

import { cookies } from 'next/headers';
import { Api } from './generated/api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Get admin token from cookies (server-side)
 * Checks both admin_token (JWT from BE) and admin_session (local session)
 */
async function getAdminTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    
    // First try to get JWT token from BE login
    const token = cookieStore.get('admin_token');
    if (token?.value) {
      return token.value;
    }
    
    // Debug: log all cookies to see what's available
    const allCookies = cookieStore.getAll();
    console.log('[DEBUG] Available cookies:', allCookies.map(c => c.name));
    
    // Fallback: if using local session, we can't get token
    // In this case, return null and let BE handle auth
    return null;
  } catch (error) {
    console.error('[DEBUG] Error reading cookies:', error);
    return null;
  }
}

/**
 * Custom fetch for server-side with cookie-based auth
 */
async function serverAuthenticatedFetch(
  ...fetchParams: Parameters<typeof fetch>
): Promise<Response> {
  try {
    const [url, options = {}] = fetchParams;
    const token = await getAdminTokenFromCookies();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Handle full URL or relative path
    const fullUrl = url.toString().startsWith('http') 
      ? url.toString() 
      : `${API_BASE_URL}${url}`;

    console.log('[DEBUG] Fetching:', fullUrl);
    console.log('[DEBUG] Has token:', !!token);

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    console.log('[DEBUG] Response status:', response.status);

    // Handle 401 - Unauthorized
    if (response.status === 401) {
      throw new Error('Unauthorized - Please login again');
    }

    // Handle other error statuses
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DEBUG] Response error:', errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error: any) {
    console.error('[DEBUG] Fetch error:', error);
    // Re-throw with more context
    if (error.message) {
      throw error;
    }
    throw new Error(`Network error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Server-side API instance
 * 
 * Note: The generated client uses Object.assign to set customFetch,
 * but since customFetch is a private property initialized with a default value,
 * Object.assign might not override it correctly.
 * 
 * We'll create the instance and verify the assignment works.
 */
const apiInstance = new Api({
  baseUrl: API_BASE_URL,
  customFetch: serverAuthenticatedFetch,
});

// Verify customFetch was assigned (TypeScript private properties are still accessible at runtime)
// @ts-ignore - accessing private property for verification
const actualCustomFetch = (apiInstance as any).customFetch;
if (actualCustomFetch !== serverAuthenticatedFetch && actualCustomFetch !== fetch) {
  console.warn('[DEBUG] customFetch assignment might have failed');
  // Force assignment (this should work at runtime even for private properties)
  // @ts-ignore
  (apiInstance as any).customFetch = serverAuthenticatedFetch;
}

export const serverApi = apiInstance;

// Export types
export * from './generated/api-client';

