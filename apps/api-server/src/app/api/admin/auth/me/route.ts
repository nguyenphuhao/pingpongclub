import { NextRequest } from 'next/server';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { addCorsHeaders, handleOptionsRequest } from '@/server/http/utils/cors.helper';

/**
 * @swagger
 * /api/admin/auth/me:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get current admin user
 *     description: Get authenticated admin user information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin user information
 *       401:
 *         description: Unauthorized
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return handleOptionsRequest(origin);
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    const admin = await getCurrentAdminFromRequest(request);

    const response = successResponse({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      avatar: admin.avatar,
      role: admin.role,
      status: admin.status,
    });
    
    return addCorsHeaders(response, origin);
  } catch (error: any) {
    const response = errorResponse(error);
    return addCorsHeaders(response, origin);
  }
}

