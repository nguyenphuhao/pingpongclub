/**
 * Group Participants API Routes
 * POST /api/admin/tournaments/:id/groups/:gid/participants - Add participant to group
 * GET  /api/admin/tournaments/:id/groups/:gid/participants - List group participants
 */

import { NextRequest } from 'next/server';
import { GroupService } from '@/server/modules/tournament/application/group.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const groupService = new GroupService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/groups/{gid}/participants:
 *   post:
 *     tags:
 *       - Admin - Tournament Groups
 *     summary: Add participant to group (Admin)
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
 *             required:
 *               - participantId
 *             properties:
 *               participantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Participant added to group
 *       400:
 *         description: Invalid input or group is full
 *       404:
 *         description: Group or participant not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; gid: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const body = await request.json();

    const participant = await groupService.addParticipantToGroup(
      params.id,
      params.gid,
      body,
      { user },
    );

    return successResponse(participant);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/tournaments/{id}/groups/{gid}/participants:
 *   get:
 *     tags:
 *       - Admin - Tournament Groups
 *     summary: List group participants (Admin)
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
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of group participants
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await groupService.getGroupParticipants(
      params.id,
      params.gid,
      page,
      limit,
      { user },
    );

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}
