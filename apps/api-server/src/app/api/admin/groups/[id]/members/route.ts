/**
 * Admin Group Members API Routes
 *
 * GET /api/admin/groups/:id/members - List group members
 * POST /api/admin/groups/:id/members - Create group member
 */

import { NextRequest } from 'next/server';
import { GroupService } from '@/server/modules/group/application/group.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody, validateQuery } from '@/server/http/utils/validation.helper';
import { CreateGroupMemberDtoSchema, QueryGroupMembersDtoSchema } from '@/shared/dtos';

const groupService = new GroupService();

/**
 * @swagger
 * /api/admin/groups/{id}/members:
 *   get:
 *     tags:
 *       - Admin - Group Members
 *     summary: Danh sach group members (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xem danh sach members cua group.'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [createdAt, seedInGroup]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Group not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = validateQuery(QueryGroupMembersDtoSchema, rawQuery);

    const result = await groupService.getGroupMembers(params.id, query);

    return successResponse(result.data, 200, result.pagination);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/groups/{id}/members:
 *   post:
 *     tags:
 *       - Admin - Group Members
 *     summary: Tao group member (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien them participant vao group.'
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
 *               - tournamentParticipantId
 *             properties:
 *               tournamentParticipantId:
 *                 type: string
 *               seedInGroup:
 *                 type: integer
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Group or participant not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    const body = await request.json();
    const dto = await validateBody(CreateGroupMemberDtoSchema, body);

    const created = await groupService.createGroupMember(params.id, dto);

    return successResponse(created, 201);
  } catch (error: any) {
    return errorResponse(error);
  }
}
