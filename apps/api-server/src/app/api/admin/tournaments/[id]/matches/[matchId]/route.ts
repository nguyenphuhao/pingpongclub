/**
 * Single Match API
 * GET - Get single match detail
 */

import { NextRequest } from 'next/server';
import { MatchService } from '@/server/modules/tournament/application/match.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const matchService = new MatchService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/matches/{matchId}:
 *   get:
 *     tags:
 *       - Admin - Tournament Matches
 *     summary: Get single match detail (Admin)
 *     description: |
 *       Returns detailed information for a specific match, including:
 *       - Match metadata (stage, round, status, etc.)
 *       - All participants with user details
 *       - Game scores if available
 *       - Group information (for GROUP stage matches)
 *       - Works for both FINAL and GROUP stage matches
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Match retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     tournamentId:
 *                       type: string
 *                     groupId:
 *                       type: string
 *                       nullable: true
 *                     stage:
 *                       type: string
 *                       enum: [FINAL, GROUP]
 *                     round:
 *                       type: integer
 *                     matchNumber:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [DRAFT, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *                     matchDate:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     courtNumber:
 *                       type: string
 *                       nullable: true
 *                     winnerId:
 *                       type: string
 *                       nullable: true
 *                     finalScore:
 *                       type: string
 *                       nullable: true
 *                       example: "3-1"
 *                     gameScores:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           game:
 *                             type: integer
 *                           player1Score:
 *                             type: integer
 *                           player2Score:
 *                             type: integer
 *                           duration:
 *                             type: integer
 *                             nullable: true
 *                     participants:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           participantId:
 *                             type: string
 *                           position:
 *                             type: integer
 *                           isWinner:
 *                             type: boolean
 *                             nullable: true
 *                           participant:
 *                             type: object
 *                             properties:
 *                               user:
 *                                 type: object
 *                                 properties:
 *                                   displayName:
 *                                     type: string
 *                                   ratingPoints:
 *                                     type: integer
 *                     group:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         displayName:
 *                           type: string
 *       404:
 *         description: Match or tournament not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const result = await matchService.getMatch(params.id, params.matchId, { user });

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/tournaments/{id}/matches/{matchId}:
 *   patch:
 *     tags:
 *       - Admin - Tournament Matches
 *     summary: Update match details (Admin)
 *     description: |
 *       Update match schedule and/or participants. Useful for:
 *       - Scheduling: Set matchDate and courtNumber
 *       - Swap participants: Change matchup between players
 *       - Fix mistakes: Correct wrong participant assignments
 *
 *       **What you can update:**
 *       - matchDate: Schedule when the match will be played
 *       - courtNumber: Assign court/table number
 *       - participants: Swap/change the matchup (provide both participants with positions)
 *
 *       **Restrictions:**
 *       - Cannot update COMPLETED matches
 *       - Participants must belong to the tournament
 *       - For GROUP stage: Participants must belong to the same group
 *       - Admin only
 *
 *       **Partial updates supported:**
 *       - Can update only matchDate/courtNumber without changing participants
 *       - Can update only participants without changing schedule
 *       - Can update all fields at once
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matchDate:
 *                 type: string
 *                 format: date-time
 *                 description: Match date/time (ISO 8601 format)
 *                 example: "2024-01-15T14:30:00Z"
 *               courtNumber:
 *                 type: string
 *                 description: Court/table assignment
 *                 example: "Court 1"
 *               participants:
 *                 type: array
 *                 description: Update participants (must provide both with positions)
 *                 items:
 *                   type: object
 *                   required:
 *                     - participantId
 *                     - position
 *                   properties:
 *                     participantId:
 *                       type: string
 *                       description: Participant ID
 *                     position:
 *                       type: integer
 *                       enum: [1, 2]
 *                       description: Position (1 or 2)
 *     responses:
 *       200:
 *         description: Match updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Full match details (same as GET /matches/:matchId)
 *       400:
 *         description: Invalid input or cannot update completed match
 *       401:
 *         description: Unauthorized - Admin only
 *       404:
 *         description: Match not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const body = await request.json();

    const result = await matchService.updateMatch(params.id, params.matchId, body, { user });

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/tournaments/{id}/matches/{matchId}:
 *   delete:
 *     tags:
 *       - Admin - Tournament Matches
 *     summary: Delete a single match (Admin)
 *     description: |
 *       Delete a specific match from the tournament. Useful for:
 *       - Removing incorrectly created matches
 *       - Fixing manual match generation errors
 *       - Cleaning up unwanted matches
 *
 *       **Safety checks:**
 *       - Cannot delete COMPLETED matches (preserves history)
 *       - Admin only
 *       - Deletes in transaction (all or nothing)
 *
 *       **What gets deleted:**
 *       - The match record
 *       - All match participants (join table records)
 *
 *       **What remains:**
 *       - Tournament participants (not removed from tournament)
 *       - Other matches
 *       - Virtual participants (might be used by other matches)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID to delete
 *     responses:
 *       200:
 *         description: Match deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Đã xóa trận đấu thành công"
 *       400:
 *         description: Cannot delete - match is completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Không thể xóa trận đấu đã hoàn thành"
 *       401:
 *         description: Unauthorized - Admin only
 *       404:
 *         description: Match or tournament not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; matchId: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);

    const result = await matchService.deleteMatch(params.id, params.matchId, { user });

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}
