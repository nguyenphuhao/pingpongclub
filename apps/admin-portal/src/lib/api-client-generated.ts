/**
 * Generated API Client Wrapper
 * 
 * This file wraps the auto-generated API client with:
 * - Authentication token injection
 * - Error handling
 * - Response transformation
 * 
 * ⚠️ This file is manually maintained to integrate with generated client
 * ⚠️ The generated client is in ./generated/api-client.ts
 * 
 * To regenerate API client: yarn generate:api
 */

import { getAdminToken, setAdminToken, removeAdminToken } from './api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Custom fetch wrapper with auth token injection
 */
async function authenticatedFetch(
  ...fetchParams: Parameters<typeof fetch>
): Promise<Response> {
  const [url, options = {}] = fetchParams;
  const token = getAdminToken();
  
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

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // Handle 401 - Unauthorized
  if (response.status === 401) {
    removeAdminToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized - Please login again');
  }

  return response;
}

/**
 * Transform response to match our API response format
 */
async function transformResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  
  // If response has success/data structure, unwrap it
  if (data.success !== undefined && data.data !== undefined) {
    return data.data as T;
  }
  
  return data as T;
}

/**
 * Generated API Client
 * 
 * Import and setup the generated client
 */
import { Api } from './generated/api-client';

// Create instance with custom fetch and auth token injection
export const generatedApi = new Api({
  baseUrl: API_BASE_URL,
  customFetch: authenticatedFetch,
});

// Export types for convenience
export * from './generated/api-client';

// Re-export token management functions for convenience
export { getAdminToken, setAdminToken, removeAdminToken };

