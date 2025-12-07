import { NextRequest } from 'next/server';
import { adminService } from '@/server/modules/admin/application/admin.service';
import { UpdateUserStatusDtoSchema } from '@/shared/dtos';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';

type RouteContext = {
  params: { id: string };
};

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update user status (Admin only)
 *     description: Update user status by admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserStatusDto'
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const admin = await getCurrentAdminFromRequest(request);
    const { id } = context.params;
    const body = await request.json();
    const dto = await validateBody(UpdateUserStatusDtoSchema, body);

    const user = await adminService.updateUserStatus(id, dto, admin.id);

    return successResponse(user);
  } catch (error: any) {
    return errorResponse(error);
  }
}

