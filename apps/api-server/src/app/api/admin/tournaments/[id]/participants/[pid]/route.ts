/**
 * Individual Tournament Participant API Routes
 * PATCH  /api/admin/tournaments/:id/participants/:pid - Update participant
 * DELETE /api/admin/tournaments/:id/participants/:pid - Remove participant
 */

import { NextRequest, NextResponse } from 'next/server';
import { TournamentService } from '@/server/modules/tournament/application/tournament.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';

const tournamentService = new TournamentService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/participants/{pid}:
 *   patch:
 *     tags: [Tournament Participants]
 *     summary: Update a participant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupId:
 *                 type: string
 *               seed:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, DISQUALIFIED, WITHDRAWN]
 *     responses:
 *       200:
 *         description: Participant updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Participant not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; pid: string } }
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const body = await request.json();

    const participant = await tournamentService.updateParticipant(
      params.id,
      params.pid,
      body,
      { user }
    );

    return NextResponse.json(participant);
  } catch (error) {
    console.error('Error updating participant:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update participant' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 400 }
    );
  }
}

/**
 * @swagger
 * /api/admin/tournaments/{id}/participants/{pid}:
 *   delete:
 *     tags: [Tournament Participants]
 *     summary: Remove a participant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: pid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Participant removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Participant not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; pid: string } }
) {
  try {
    const user = await getCurrentAdminFromRequest(request);

    await tournamentService.removeParticipant(
      params.id,
      params.pid,
      { user }
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error removing participant:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove participant' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 400 }
    );
  }
}
