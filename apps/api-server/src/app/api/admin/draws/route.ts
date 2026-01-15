/**
 * Admin Draw API Routes
 *
 * GET /api/admin/draws - List draw sessions
 * POST /api/admin/draws - Create draw session
 */

import { NextRequest } from 'next/server';
import { DrawService } from '@/server/modules/draw/application/draw.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody, validateQuery } from '@/server/http/utils/validation.helper';
import { CreateDrawDtoSchema, QueryDrawsDtoSchema } from '@/shared/dtos';

const drawService = new DrawService();

/**
 * @swagger
 * /api/admin/draws:
 *   get:
 *     tags:
 *       - Admin - Draws
 *     summary: Danh sach phien boc tham (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: xem danh sach phien boc tham.'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tournamentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: stageId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DOUBLES_PAIRING, GROUP_ASSIGNMENT, KNOCKOUT_PAIRING]
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await getCurrentAdminFromRequest(request);

    const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = validateQuery(QueryDrawsDtoSchema, rawQuery);

    const draws = await drawService.getDraws(query);

    return successResponse(draws);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/draws:
 *   post:
 *     tags:
 *       - Admin - Draws
 *     summary: Tao phien boc tham (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: tao phien boc tham.'
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tournamentId
 *               - type
 *               - payload
 *             properties:
 *               tournamentId:
 *                 type: string
 *               stageId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [DOUBLES_PAIRING, GROUP_ASSIGNMENT, KNOCKOUT_PAIRING]
 *               payload:
 *                 type: object
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await getCurrentAdminFromRequest(request);

    const body = await request.json();
    const dto = await validateBody(CreateDrawDtoSchema, body);

    const draw = await drawService.createDraw(dto);

    return successResponse(draw, 201);
  } catch (error: any) {
    return errorResponse(error);
  }
}
