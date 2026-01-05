/**
 * Generate Bracket API
 * POST /api/admin/tournaments/:id/bracket/generate - Auto-generate bracket matches
 */

import { NextRequest } from 'next/server';
import { BracketService } from '@/server/modules/tournament/application/bracket.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const bracketService = new BracketService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/bracket/generate:
 *   post:
 *     tags:
 *       - Admin - Tournament Bracket
 *     deprecated: true
 *     summary: Generate tournament bracket (Admin) - DEPRECATED
 *     description: |
 *       ⚠️ **DEPRECATED**: Use `POST /api/admin/tournaments/:id/matches/generate` with `stage: "FINAL"` instead.
 *
 *       This endpoint will be removed in a future version.
 *
 *       Automatically generates all bracket matches for SINGLE_ELIMINATION tournaments. For TWO_STAGES, generates final stage bracket from group winners.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               includeThirdPlaceMatch:
 *                 type: boolean
 *                 description: Whether to include 3rd place match (default from tournament config)
 *     responses:
 *       201:
 *         description: Bracket generated successfully
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
 *                     totalMatches:
 *                       type: integer
 *                     matches:
 *                       type: array
 *                       description: Flat array of all matches for @g-loot/react-tournament-brackets
 *       400:
 *         description: Invalid input (e.g., participants not locked, bracket already exists)
 *       404:
 *         description: Tournament not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const body = await request.json().catch(() => ({}));

    const result = await bracketService.generateBracket(params.id, body, { user });

    // Add deprecation warning
    const response = successResponse(result, 201);
    response.headers.set('X-Deprecated', 'true');
    response.headers.set(
      'X-Deprecation-Message',
      'Use POST /api/admin/tournaments/:id/matches/generate with stage="FINAL" instead',
    );

    return response;
  } catch (error: any) {
    return errorResponse(error);
  }
}
