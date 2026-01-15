/**
 * Admin Tournament Participants Seeding API Routes
 *
 * POST /api/admin/tournaments/:id/participants/seed - Reseed participants by elo
 */

import { NextRequest } from 'next/server';
import { TournamentParticipantService } from '@/server/modules/tournament-participant/application/tournament-participant.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { BadRequestException } from '@/server/common/exceptions';

const participantService = new TournamentParticipantService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/participants/seed:
 *   post:
 *     tags:
 *       - Admin - Tournament Participants
 *     summary: Reseed participants theo elo (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien cap nhat seed theo elo.'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               by:
 *                 type: string
 *                 enum: [elo]
 *     responses:
 *       200:
 *         description: Success
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

    const body = await request.json().catch(() => ({}));
    if (body?.by && body.by !== 'elo') {
      throw new BadRequestException('Tham số by không hợp lệ');
    }

    await participantService.seedParticipantsByElo(params.id);

    return successResponse({ success: true });
  } catch (error: any) {
    return errorResponse(error);
  }
}
