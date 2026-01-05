/**
 * Bulk Import Participants API Route
 * POST /api/admin/tournaments/:id/participants/bulk - Bulk import participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { TournamentService } from '@/server/modules/tournament/application/tournament.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';

const tournamentService = new TournamentService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/participants/bulk:
 *   post:
 *     tags: [Tournament Participants]
 *     summary: Bulk import participants
 *     description: Import multiple participants at once
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
 *               - participants
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - userId
 *                   properties:
 *                     userId:
 *                       type: string
 *                     seed:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Bulk import completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const body = await request.json();

    if (!body.participants || !Array.isArray(body.participants)) {
      return NextResponse.json(
        { error: 'participants array is required' },
        { status: 400 }
      );
    }

    const result = await tournamentService.bulkImportParticipants(
      params.id,
      body.participants,
      { user }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error bulk importing participants:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to bulk import participants' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 400 }
    );
  }
}
