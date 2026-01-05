/**
 * Single Group API Routes
 * GET    /api/admin/tournaments/:id/groups/:gid - Get group details
 * PATCH  /api/admin/tournaments/:id/groups/:gid - Update group
 * DELETE /api/admin/tournaments/:id/groups/:gid - Delete group
 */

import { NextRequest } from 'next/server';
import { GroupService } from '@/server/modules/tournament/application/group.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const groupService = new GroupService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/groups/{gid}:
 *   get:
 *     tags:
 *       - Admin - Tournament Groups
 *     summary: Get group details (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: gid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Group details
 *       404:
 *         description: Group not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; gid: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('includeDetails') === 'true';

    const group = await groupService.getGroupById(
      params.id,
      params.gid,
      { user },
      includeDetails,
    );

    return successResponse(group);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/tournaments/{id}/groups/{gid}:
 *   patch:
 *     tags:
 *       - Admin - Tournament Groups
 *     summary: Update group (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: gid
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
 *               displayName:
 *                 type: string
 *               participantsPerGroup:
 *                 type: integer
 *               participantsAdvancing:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Group updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Group not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; gid: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const body = await request.json();

    const group = await groupService.updateGroup(params.id, params.gid, body, { user });

    return successResponse(group);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/tournaments/{id}/groups/{gid}:
 *   delete:
 *     tags:
 *       - Admin - Tournament Groups
 *     summary: Delete group (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: gid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Group deleted successfully
 *       400:
 *         description: Cannot delete group with matches
 *       404:
 *         description: Group not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; gid: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);

    await groupService.deleteGroup(params.id, params.gid, { user });

    return successResponse({ message: 'Group deleted successfully' });
  } catch (error: any) {
    return errorResponse(error);
  }
}
