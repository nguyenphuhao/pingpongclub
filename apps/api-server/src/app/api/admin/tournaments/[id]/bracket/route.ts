/**
 * Get Bracket API
 * GET /api/admin/tournaments/:id/bracket - Get bracket structure for visualization
 */

import { NextRequest } from 'next/server';
import { BracketService } from '@/server/modules/tournament/application/bracket.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const bracketService = new BracketService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/bracket:
 *   get:
 *     tags:
 *       - Admin - Tournament Bracket
 *     summary: Get tournament bracket (Admin)
 *     description: Returns bracket structure formatted for @g-loot/react-tournament-brackets visualization
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
 *         description: Bracket structure with all matches
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tournamentId:
 *                       type: string
 *                     format:
 *                       type: string
 *                       enum: [SINGLE_ELIMINATION, DOUBLE_ELIMINATION]
 *                     totalRounds:
 *                       type: integer
 *                       example: 4
 *                     totalMatches:
 *                       type: integer
 *                       example: 15
 *                     matches:
 *                       type: array
 *                       description: Flat array compatible with @g-loot/react-tournament-brackets
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                             example: "SF1"
 *                           nextMatchId:
 *                             type: string
 *                             nullable: true
 *                           tournamentRoundText:
 *                             type: string
 *                             example: "Semi Final"
 *                           startTime:
 *                             type: string
 *                             format: date-time
 *                           state:
 *                             type: string
 *                             enum: [SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED]
 *                           participants:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 resultText:
 *                                   type: string
 *                                   nullable: true
 *                                   example: "2-1"
 *                                 isWinner:
 *                                   type: boolean
 *                                 status:
 *                                   type: string
 *                                   nullable: true
 *                                   enum: [PLAYED, NO_SHOW, WALK_OVER, NO_PARTY]
 *                                 name:
 *                                   type: string
 *                                   example: "John Doe"
 *       404:
 *         description: Tournament or bracket not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);

    const result = await bracketService.getBracket(params.id, { user });

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}
