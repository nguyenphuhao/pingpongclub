import { NextRequest } from 'next/server';
import { adminService } from '@/server/modules/admin/application/admin.service';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get dashboard statistics (Admin only)
 *     description: Get dashboard statistics including total users, new users, active users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdminFromRequest(request);
    const stats = await adminService.getDashboardStats(admin.id);

    return successResponse(stats);
  } catch (error: any) {
    return errorResponse(error);
  }
}

