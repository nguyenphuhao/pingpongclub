import { NextRequest } from 'next/server';
import { adminService } from '@/server/modules/admin/application/admin.service';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';

type RouteContext = {
  params: { id: string };
};

/**
 * @swagger
 * /api/admin/users/{id}/sessions:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get user active sessions (Admin only)
 *     description: Get all active sessions for any user by admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const admin = await getCurrentAdminFromRequest(request);
    const { id } = context.params;

    const sessions = await adminService.getUserActiveSessions(id, admin.id);

    return successResponse({
      sessions,
      total: sessions.length,
    });
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/users/{id}/sessions:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Force logout all user sessions (Admin only)
 *     description: Logout from all devices for any user by admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: All sessions logged out successfully
 *       401:
 *         description: Unauthorized
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const admin = await getCurrentAdminFromRequest(request);
    const { id } = context.params;

    const loggedOutCount = await adminService.forceLogoutAllUserSessions(id, admin.id);

    return successResponse({
      message: `Logged out from ${loggedOutCount} device(s)`,
      loggedOutCount,
    });
  } catch (error: any) {
    return errorResponse(error);
  }
}

