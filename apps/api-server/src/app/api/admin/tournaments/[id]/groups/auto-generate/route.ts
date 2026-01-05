/**
 * Auto-Generate Groups API
 * POST /api/admin/tournaments/:id/groups/auto-generate - Auto-create groups and assign participants
 */

import { NextRequest } from 'next/server';
import { GroupService } from '@/server/modules/tournament/application/group.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const groupService = new GroupService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/groups/auto-generate:
 *   post:
 *     tags:
 *       - Admin - Tournament Groups
 *     summary: Auto-generate groups and assign participants (Admin)
 *     description: Automatically creates groups and assigns participants based on seeding order. Uses straight seeding method (1-4 to Group A, 5-8 to Group B, etc.)
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
 *               numberOfGroups:
 *                 type: integer
 *                 description: Target number of groups (e.g., 4 groups). Provide this OR participantsPerGroup, not both.
 *                 example: 4
 *               participantsPerGroup:
 *                 type: integer
 *                 description: Target participants per group (e.g., 4 people/group). Provide this OR numberOfGroups, not both.
 *                 example: 4
 *               participantsAdvancing:
 *                 type: integer
 *                 description: How many advance from each group (optional, defaults from tournament config)
 *                 example: 2
 *               groupNamePrefix:
 *                 type: string
 *                 description: Prefix for group names (default "Group")
 *                 example: "Bảng"
 *     responses:
 *       201:
 *         description: Groups created and participants assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     groupsCreated:
 *                       type: integer
 *                       example: 4
 *                     participantsAssigned:
 *                       type: integer
 *                       example: 16
 *                     groups:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                             example: "A"
 *                           displayName:
 *                             type: string
 *                             example: "Group A"
 *                           participantCount:
 *                             type: integer
 *                             example: 4
 *                           participantIds:
 *                             type: array
 *                             items:
 *                               type: string
 *                           seeds:
 *                             type: array
 *                             items:
 *                               type: integer
 *       400:
 *         description: Invalid input (e.g., participants not locked, invalid group configuration)
 *       404:
 *         description: Tournament not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const body = await request.json();

    const result = await groupService.autoGenerateGroups(params.id, body, { user });

    return successResponse(result, 201);
  } catch (error: any) {
    return errorResponse(error);
  }
}
