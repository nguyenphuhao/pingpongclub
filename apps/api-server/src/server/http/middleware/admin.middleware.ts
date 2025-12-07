import { NextRequest } from 'next/server';
import { adminService } from '@/server/modules/admin/application/admin.service';
import { UnauthorizedException } from '@/server/common/exceptions';

/**
 * Admin Middleware Helpers
 * Verify admin authentication from JWT token
 */

/**
 * Extract and verify admin token from request
 */
export async function getCurrentAdminFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  const admin = await adminService.verifyAdminToken(token);

  return admin;
}

