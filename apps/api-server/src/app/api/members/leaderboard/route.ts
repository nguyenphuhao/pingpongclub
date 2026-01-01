/**
 * Leaderboard API Route (Mobile App & Public)
 * 
 * GET /api/members/leaderboard - Get club leaderboard
 */

import { NextRequest } from 'next/server';
import { MemberService } from '@/server/modules/member/application/member.service';
import { getCurrentUserFromRequest } from '@/server/http/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { PlayerRank } from '@pingclub/database';

const memberService = new MemberService();

/**
 * @swagger
 * /api/members/leaderboard:
 *   get:
 *     tags:
 *       - Members
 *     summary: Get club leaderboard
 *     description: Get top players ranked by rating points
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: rank
 *         schema:
 *           type: string
 *           enum: [A_STAR, A, B, C, D, E, F, G, H]
 *         description: Filter by specific rank
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of players to return
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const currentUser = await getCurrentUserFromRequest(request);

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const options = {
      rank: (searchParams.get('rank') as PlayerRank) || undefined,
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    // Build request context
    const ctx = {
      user: {
        id: currentUser.id,
        role: currentUser.role,
      },
    };

    // Get leaderboard using shared service
    const leaderboard = await memberService.getLeaderboard(options, ctx);

    return successResponse(leaderboard);
  } catch (error: any) {
    return errorResponse(error);
  }
}

