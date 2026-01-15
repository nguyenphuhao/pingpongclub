/**
 * Admin Group Member Detail API Routes
 *
 * PATCH /api/admin/groups/:id/members/:participantId - Update group member
 * DELETE /api/admin/groups/:id/members/:participantId - Delete group member
 */

import { NextRequest } from 'next/server';
import { GroupService } from '@/server/modules/group/application/group.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { UpdateGroupMemberDtoSchema } from '@/shared/dtos';

const groupService = new GroupService();

/**
 * @swagger
 * /api/admin/groups/{id}/members/{participantId}:
 *   patch:
 *     tags:
 *       - Admin - Group Members
 *     summary: Cap nhat group member (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien cap nhat group member.'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: participantId
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
 *               seedInGroup:
 *                 type: integer
 *               status:
 *                 type: string
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
  { params }: { params: { id: string; participantId: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    const body = await request.json();
    const dto = await validateBody(UpdateGroupMemberDtoSchema, body);

    const updated = await groupService.updateGroupMember(params.id, params.participantId, dto);

    return successResponse(updated);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/groups/{id}/members/{participantId}:
 *   delete:
 *     tags:
 *       - Admin - Group Members
 *     summary: Xoa group member (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xoa group member.'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: participantId
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
  { params }: { params: { id: string; participantId: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    await groupService.deleteGroupMember(params.id, params.participantId);

    return successResponse({ message: 'Đã xóa group member thành công' });
  } catch (error: any) {
    return errorResponse(error);
  }
}
