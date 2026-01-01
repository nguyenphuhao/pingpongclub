/**
 * Members API Routes (Mobile App & Public)
 * 
 * GET /api/members - List members with filters
 */

import { NextRequest } from 'next/server';
import { MemberService } from '@/server/modules/member/application/member.service';
import { getCurrentUserFromRequest } from '@/server/http/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { PlayerRank, UserStatus, Gender } from '@pingclub/database';

const memberService = new MemberService();

/**
 * @swagger
 * /api/members:
 *   get:
 *     tags:
 *       - Members
 *     summary: List members
 *     description: Get paginated list of club members with filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or nickname
 *       - in: query
 *         name: rank
 *         schema:
 *           type: string
 *           enum: [A_STAR, A, B, C, D, E, F, G, H, UNRANKED]
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, rating, winRate, totalMatches, createdAt]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
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
    const query = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      rank: (searchParams.get('rank') as PlayerRank) || undefined,
      gender: (searchParams.get('gender') as Gender) || undefined,
      minRating: searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : undefined,
      maxRating: searchParams.get('maxRating') ? parseInt(searchParams.get('maxRating')!) : undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    // Build request context
    const ctx = {
      user: {
        id: currentUser.id,
        role: currentUser.role,
      },
    };

    // Get members using shared service
    const result = await memberService.getMembers(query, ctx);

    return successResponse(result.data, 200, result.pagination);
  } catch (error: any) {
    return errorResponse(error);
  }
}

