/**
 * Tournament Groups API Routes
 * POST   /api/admin/tournaments/:id/groups - Create group
 * GET    /api/admin/tournaments/:id/groups - List groups
 */

import { NextRequest } from 'next/server';
import { GroupService } from '@/server/modules/tournament/application/group.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const groupService = new GroupService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/groups:
 *   post:
 *     tags:
 *       - Admin - Tournament Groups
 *     summary: Create a new group (Admin)
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
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: A
 *               displayName:
 *                 type: string
 *                 example: Group A
 *               participantsPerGroup:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 20
 *                 example: 4
 *               participantsAdvancing:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Group created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Tournament is not TWO_STAGES
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const body = await request.json();

    const group = await groupService.createGroup(params.id, body, { user });

    return successResponse(group, 201);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/tournaments/{id}/groups:
 *   get:
 *     tags:
 *       - Admin - Tournament Groups
 *     summary: List tournament groups (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of groups with pagination
 *       401:
 *         description: Unauthorized
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const { searchParams } = new URL(request.url);

    const query = {
      status: searchParams.get('status') as any,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
    };

    const result = await groupService.getGroups(params.id, query, { user });

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}
