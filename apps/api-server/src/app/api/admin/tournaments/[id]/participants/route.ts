/**
 * Admin Tournament Participants API Routes
 *
 * GET /api/admin/tournaments/:id/participants - List participants
 * POST /api/admin/tournaments/:id/participants - Create participant
 */

import { NextRequest } from 'next/server';
import { TournamentParticipantService } from '@/server/modules/tournament-participant/application/tournament-participant.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody, validateQuery } from '@/server/http/utils/validation.helper';
import {
  CreateTournamentParticipantDtoSchema,
  QueryTournamentParticipantsDtoSchema,
} from '@/shared/dtos';

const participantService = new TournamentParticipantService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/participants:
 *   get:
 *     tags:
 *       - Admin - Tournament Participants
 *     summary: Danh sach participants (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xem danh sach participants.'
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
 *           enum: [createdAt, displayName, seed]
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
 *         description: Tournament not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = validateQuery(QueryTournamentParticipantsDtoSchema, rawQuery);

    const result = await participantService.getParticipantsByTournament(params.id, query);

    return successResponse(result.data, 200, result.pagination);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/tournaments/{id}/participants:
 *   post:
 *     tags:
 *       - Admin - Tournament Participants
 *     summary: Tao participant (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien tao participant.'
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
 *               - displayName
 *             properties:
 *               displayName:
 *                 type: string
 *               memberIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               seed:
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
 *         description: Tournament not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    const body = await request.json();
    const dto = await validateBody(CreateTournamentParticipantDtoSchema, body);

    const created = await participantService.createParticipant(params.id, dto);

    return successResponse(created, 201);
  } catch (error: any) {
    return errorResponse(error);
  }
}
