/**
 * Unlock Participants API Route
 * POST /api/admin/tournaments/:id/participants/unlock - Unlock tournament participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { TournamentService } from '@/server/modules/tournament/application/tournament.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';

const tournamentService = new TournamentService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/participants/unlock:
 *   post:
 *     tags: [Tournament Participants]
 *     summary: Unlock tournament participants
 *     description: Unlock the participants list to allow changes before group assignment or matches.
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
 *         description: Participants unlocked successfully
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
    const tournament = await tournamentService.unlockParticipants(params.id, { user });

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error unlocking participants:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to unlock participants' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 400 }
    );
  }
}
