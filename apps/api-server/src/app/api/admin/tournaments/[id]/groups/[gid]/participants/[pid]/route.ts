/**
 * Remove Participant from Group API
 * DELETE /api/admin/tournaments/:id/groups/:gid/participants/:pid - Remove participant
 */

import { NextRequest } from 'next/server';
import { GroupService } from '@/server/modules/tournament/application/group.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const groupService = new GroupService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/groups/{gid}/participants/{pid}:
 *   delete:
 *     tags:
 *       - Admin - Tournament Groups
 *     summary: Remove participant from group (Admin)
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
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participant removed from group
 *       400:
 *         description: Cannot remove from group in progress
 *       404:
 *         description: Participant or group not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; gid: string; pid: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);

    await groupService.removeParticipantFromGroup(
      params.id,
      params.gid,
      params.pid,
      { user },
    );

    return successResponse({ message: 'Participant removed from group successfully' });
  } catch (error: any) {
    return errorResponse(error);
  }
}
