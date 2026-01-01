import { NextResponse } from 'next/server';

/**
 * CORS Helper
 * Add CORS headers to API responses for cross-origin requests
 */

const ALLOWED_ORIGINS = [
  'http://localhost:8080', // admin-portal
  'http://localhost:3000', // api-server (for testing)
  'http://localhost:3001', // other local apps
];

export function addCorsHeaders(response: NextResponse, origin?: string | null): NextResponse {
  const requestOrigin = origin || '*';
  
  // Check if origin is allowed (in production, should be more restrictive)
  const allowedOrigin = process.env.NODE_ENV === 'development' 
    ? requestOrigin 
    : ALLOWED_ORIGINS.includes(requestOrigin) 
      ? requestOrigin 
      : null;

  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

export function handleOptionsRequest(origin?: string | null): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response, origin);
}

