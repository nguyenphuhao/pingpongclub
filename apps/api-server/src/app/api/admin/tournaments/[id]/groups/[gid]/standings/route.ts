/**
 * Group Standings API
 * GET /api/admin/tournaments/:id/groups/:gid/standings - Get group standings with tie breaks
 */

import { NextRequest } from 'next/server';
import { GroupService } from '@/server/modules/tournament/application/group.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const groupService = new GroupService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/groups/{gid}/standings:
 *   get:
 *     tags:
 *       - Admin - Tournament Groups
 *     summary: Get group standings with tie breaks (Admin)
 *     description: Returns group standings sorted by match wins with tie breaks applied
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
 *         description: Group standings with complete statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groupId:
 *                   type: string
 *                 groupName:
 *                   type: string
 *                 tieBreakRules:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [WINS_VS_TIED, GAME_SET_DIFFERENCE, POINTS_DIFFERENCE]
 *                 standings:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: integer
 *                       participant:
 *                         type: object
 *                       matchRecord:
 *                         type: object
 *                         properties:
 *                           wins:
 *                             type: integer
 *                           losses:
 *                             type: integer
 *                           draws:
 *                             type: integer
 *                       gameRecord:
 *                         type: object
 *                         properties:
 *                           wins:
 *                             type: integer
 *                           losses:
 *                             type: integer
 *                           difference:
 *                             type: integer
 *                       pointsRecord:
 *                         type: object
 *                         properties:
 *                           for:
 *                             type: integer
 *                           against:
 *                             type: integer
 *                           difference:
 *                             type: integer
 *                       tieBreakInfo:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           appliedRule:
 *                             type: string
 *                           description:
 *                             type: string
 *                       isAdvancing:
 *                         type: boolean
 *       404:
 *         description: Group not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; gid: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);

    const standings = await groupService.getStandings(params.id, params.gid, { user });

    return successResponse(standings);
  } catch (error: any) {
    return errorResponse(error);
  }
}
