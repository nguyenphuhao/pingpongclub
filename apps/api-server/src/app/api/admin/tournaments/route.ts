/**
 * Admin Tournament API Routes
 *
 * GET /api/admin/tournaments - List tournaments
 * POST /api/admin/tournaments - Create tournament
 */

import { NextRequest } from 'next/server';
import { TournamentService } from '@/server/modules/tournament/application/tournament.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody, validateQuery } from '@/server/http/utils/validation.helper';
import { CreateTournamentDtoSchema, QueryTournamentsDtoSchema } from '@/shared/dtos';

const tournamentService = new TournamentService();

/**
 * @swagger
 * /api/admin/tournaments:
 *   get:
 *     tags:
 *       - Admin - Tournaments
 *     summary: Danh sach giai dau (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xem danh sach giai dau.'
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Tim theo ten hoac mo ta (>= 2 ky tu)
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name]
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await getCurrentAdminFromRequest(request);

    const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = validateQuery(QueryTournamentsDtoSchema, rawQuery);

    const result = await tournamentService.getTournaments(query);

    return successResponse(result.data, 200, result.pagination);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/tournaments:
 *   post:
 *     tags:
 *       - Admin - Tournaments
 *     summary: Tao giai dau (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien tao giai dau moi.'
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - matchFormat
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
 *               matchFormat:
 *                 type: string
 *                 enum: [SINGLE, DOUBLES]
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
    const dto = await validateBody(CreateTournamentDtoSchema, body);

    const created = await tournamentService.createTournament(dto);

    return successResponse(created, 201);
  } catch (error: any) {
    return errorResponse(error);
  }
}
