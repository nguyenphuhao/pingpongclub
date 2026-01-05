/**
 * Match Statistics API
 * GET - Get match statistics for a tournament
 */

import { NextRequest } from 'next/server';
import { MatchService } from '@/server/modules/tournament/application/match.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const matchService = new MatchService();

/**
 * @swagger
 * /api/admin/tournaments/{id}/matches/stats:
 *   get:
 *     tags:
 *       - Admin - Tournament Matches
 *     summary: Get match statistics (Admin)
 *     description: |
 *       Returns statistics about matches in a tournament:
 *       - Total match count
 *       - Breakdown by stage (FINAL vs GROUP)
 *       - Breakdown by status (DRAFT, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tournament ID
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
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
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     byStage:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           stage:
 *                             type: string
 *                             example: "FINAL"
 *                           count:
 *                             type: integer
 *                             example: 7
 *                     byStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                             example: "SCHEDULED"
 *                           count:
 *                             type: integer
 *                             example: 10
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentAdminFromRequest(request);
    const result = await matchService.getMatchStats(params.id, { user });

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}
