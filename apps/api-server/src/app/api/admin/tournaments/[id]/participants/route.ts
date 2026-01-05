/**
 * Tournament Participants API Routes
 * POST   /api/admin/tournaments/:id/participants - Add participant
 * GET    /api/admin/tournaments/:id/participants - List participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { TournamentService } from '@/server/modules/tournament/application/tournament.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';

const tournamentService = new TournamentService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/participants:
 *   post:
 *     tags: [Tournament Participants]
 *     summary: Add a participant to tournament
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
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *               groupId:
 *                 type: string
 *               seed:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Participant added successfully
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

    const participant = await tournamentService.addParticipant(
      params.id,
      body,
      { user }
    );

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add participant' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 400 }
    );
  }
}

/**
 * @swagger
 * /api/admin/tournaments/{id}/participants:
 *   get:
 *     tags: [Tournament Participants]
 *     summary: List tournament participants
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
 *           default: 50
 *     responses:
 *       200:
 *         description: List of participants
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Tournament not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const result = await tournamentService.getParticipants(
      params.id,
      page,
      limit,
      { user }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch participants' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    );
  }
}
