import { NextRequest } from 'next/server';
import { adminService } from '@/server/modules/admin/application/admin.service';
import { UpdateUserRoleDtoSchema } from '@/shared/dtos';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';

type RouteContext = {
  params: { id: string };
};

/**
 * @swagger
 * /api/admin/users/{id}/role:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update user role (Admin only)
 *     description: Update user role by admin
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
 *             $ref: '#/components/schemas/UpdateUserRoleDto'
 *     responses:
 *       200:
 *         description: User role updated successfully
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
    const dto = await validateBody(UpdateUserRoleDtoSchema, body);

    const user = await adminService.updateUserRole(id, dto, admin.id);

    return successResponse(user);
  } catch (error: any) {
    return errorResponse(error);
  }
}

