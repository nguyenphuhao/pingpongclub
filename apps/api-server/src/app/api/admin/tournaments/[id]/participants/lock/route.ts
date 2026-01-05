/**
 * Lock Participants API Route
 * POST /api/admin/tournaments/:id/participants/lock - Lock tournament participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { TournamentService } from '@/server/modules/tournament/application/tournament.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';

const tournamentService = new TournamentService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/participants/lock:
 *   post:
 *     tags: [Tournament Participants]
 *     summary: Lock tournament participants
 *     description: Lock the participants list to prevent further changes. Required before starting a tournament.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Participants locked successfully
 *       400:
 *         description: Invalid request or already locked
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

    const tournament = await tournamentService.lockParticipants(
      params.id,
      { user }
    );

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error locking participants:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to lock participants' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 400 }
    );
  }
}
