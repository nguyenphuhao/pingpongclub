/**
 * Admin Tournament Stages API Routes
 *
 * GET /api/admin/tournaments/:id/stages - List stages
 * POST /api/admin/tournaments/:id/stages - Create stage
 */

import { NextRequest } from 'next/server';
import { StageService } from '@/server/modules/stage/application/stage.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody, validateQuery } from '@/server/http/utils/validation.helper';
import { CreateStageDtoSchema, QueryStagesDtoSchema } from '@/shared/dtos';

const stageService = new StageService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/stages:
 *   get:
 *     tags:
 *       - Admin - Stages
 *     summary: Danh sach stage theo giai dau (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xem danh sach stage cua giai dau.'
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
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [stageOrder, createdAt, name]
 *           default: stageOrder
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Tournament not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = validateQuery(QueryStagesDtoSchema, rawQuery);

    const result = await stageService.getStagesByTournament(params.id, query);

    return successResponse(result.data, 200, result.pagination);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/tournaments/{id}/stages:
 *   post:
 *     tags:
 *       - Admin - Stages
 *     summary: Tao stage (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien tao stage moi cho giai dau.'
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
 *               - type
 *               - stageOrder
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [GROUP, KNOCKOUT]
 *               stageOrder:
 *                 type: integer
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
 *         description: Tournament not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    const body = await request.json();
    const dto = await validateBody(CreateStageDtoSchema, body);

    const created = await stageService.createStage(params.id, dto);

    return successResponse(created, 201);
  } catch (error: any) {
    return errorResponse(error);
  }
}
