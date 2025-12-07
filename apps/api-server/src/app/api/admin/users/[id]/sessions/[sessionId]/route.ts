import { NextRequest } from 'next/server';
import { adminService } from '@/server/modules/admin/application/admin.service';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';

type RouteContext = {
  params: { id: string; sessionId: string };
};

/**
 * @swagger
 * /api/admin/users/{id}/sessions/{sessionId}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Force logout specific session (Admin only)
 *     description: Logout from a specific session for any user by admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Refresh token ID (session ID)
 *     responses:
 *       200:
 *         description: Session logged out successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const admin = await getCurrentAdminFromRequest(request);
    const { id, sessionId } = context.params;

    await adminService.forceLogoutUserSession(id, sessionId, admin.id);

    return successResponse({
      message: 'Session logged out successfully',
    });
  } catch (error: any) {
    return errorResponse(error);
  }
}

