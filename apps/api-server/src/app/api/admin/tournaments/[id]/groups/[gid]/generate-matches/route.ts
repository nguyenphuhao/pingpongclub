/**
 * Generate Group Matches API
 * POST /api/admin/tournaments/:id/groups/:gid/generate-matches - Generate round robin matches
 */

import { NextRequest } from 'next/server';
import { GroupService } from '@/server/modules/tournament/application/group.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const groupService = new GroupService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/groups/{gid}/generate-matches:
 *   post:
 *     tags:
 *       - Admin - Tournament Groups
 *     deprecated: true
 *     summary: Generate round robin matches for group (Admin) - DEPRECATED
 *     description: |
 *       ⚠️ **DEPRECATED**: Use `POST /api/admin/tournaments/:id/matches/generate` with `stage: "GROUP"` and `groupId` instead.
 *
 *       This endpoint will be removed in a future version.
 *
 *       Generates all round robin matches for participants in the group
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matchupsPerPair:
 *                 type: integer
 *                 default: 1
 *                 description: How many times each pair plays
 *     responses:
 *       201:
 *         description: Matches generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groupId:
 *                   type: string
 *                 matchesGenerated:
 *                   type: integer
 *                 rounds:
 *                   type: integer
 *                 matches:
 *                   type: array
 *       400:
 *         description: Invalid input or group not ready
 *       404:
 *         description: Group not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; gid: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const body = await request.json().catch(() => ({}));

    const result = await groupService.generateMatches(
      params.id,
      params.gid,
      body,
      { user },
    );

    // Add deprecation warning
    const response = successResponse(result, 201);
    response.headers.set('X-Deprecated', 'true');
    response.headers.set(
      'X-Deprecation-Message',
      'Use POST /api/admin/tournaments/:id/matches/generate with stage="GROUP" and groupId instead',
    );

    return response;
  } catch (error: any) {
    return errorResponse(error);
  }
}
