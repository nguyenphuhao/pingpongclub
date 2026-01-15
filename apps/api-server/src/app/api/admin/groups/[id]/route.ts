/**
 * Admin Group Detail API Routes
 *
 * GET /api/admin/groups/:id - Get group detail
 * PATCH /api/admin/groups/:id - Update group
 * DELETE /api/admin/groups/:id - Delete group
 */

import { NextRequest } from 'next/server';
import { GroupService } from '@/server/modules/group/application/group.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { UpdateGroupDtoSchema } from '@/shared/dtos';

const groupService = new GroupService();

/**
 * @swagger
 * /api/admin/groups/{id}:
 *   get:
 *     tags:
 *       - Admin - Groups
 *     summary: Chi tiet group (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xem chi tiet group.'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    const group = await groupService.getGroupById(params.id);

    return successResponse(group);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/groups/{id}:
 *   patch:
 *     tags:
 *       - Admin - Groups
 *     summary: Cap nhat group (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien cap nhat group.'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               groupOrder:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    const body = await request.json();
    const dto = await validateBody(UpdateGroupDtoSchema, body);

    const updated = await groupService.updateGroup(params.id, dto);

    return successResponse(updated);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/groups/{id}:
 *   delete:
 *     tags:
 *       - Admin - Groups
 *     summary: Xoa group (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xoa group.'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    await groupService.deleteGroup(params.id);

    return successResponse({ message: 'Đã xóa group thành công' });
  } catch (error: any) {
    return errorResponse(error);
  }
}
