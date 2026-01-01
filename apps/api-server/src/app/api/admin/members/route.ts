/**
 * Admin Members API Routes
 * 
 * GET /api/admin/members - List members (admin view with full data)
 * POST /api/admin/members - Create new member
 */

import { NextRequest } from 'next/server';
import { MemberService } from '@/server/modules/member/application/member.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { PlayerRank, UserStatus, Gender } from '@pingclub/database';

const memberService = new MemberService();

/**
 * @swagger
 * /api/admin/members:
 *   get:
 *     tags:
 *       - Admin - Members
 *     summary: List all members (Admin)
 *     description: Get paginated list of all club members with full admin data
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
 *         description: Search by name, nickname, email, or phone
 *       - in: query
 *         name: rank
 *         schema:
 *           type: string
 *           enum: [A_STAR, A, B, C, D, E, F, G, H, UNRANKED]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED, DELETED]
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY]
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: integer
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
 *       403:
 *         description: Forbidden (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin
    const currentAdmin = await getCurrentAdminFromRequest(request);

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const query = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search') || undefined,
      rank: (searchParams.get('rank') as PlayerRank) || undefined,
      status: (searchParams.get('status') as UserStatus) || undefined,
      gender: (searchParams.get('gender') as Gender) || undefined,
      minRating: searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : undefined,
      maxRating: searchParams.get('maxRating') ? parseInt(searchParams.get('maxRating')!) : undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    };

    // Build request context (treat admin as ADMIN role)
    const ctx = {
      user: {
        id: currentAdmin.id,
        role: 'ADMIN' as const,
      },
    };

    // Get members using shared service (admin gets full data)
    const result = await memberService.getMembers(query, ctx);

    return successResponse(result.data, 200, result.pagination);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/members:
 *   post:
 *     tags:
 *       - Admin - Members
 *     summary: Create new member (Admin)
 *     description: Create a new club member
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - nickname
 *               - displayName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               nickname:
 *                 type: string
 *               displayName:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               initialRating:
 *                 type: integer
 *                 default: 1000
 *               startedPlayingAt:
 *                 type: string
 *                 format: date-time
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               playStyle:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       201:
 *         description: Member created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       409:
 *         description: Email already exists
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin
    const currentAdmin = await getCurrentAdminFromRequest(request);

    // Parse request body
    const data = await request.json();

    // Build request context (treat admin as ADMIN role)
    const ctx = {
      user: {
        id: currentAdmin.id,
        role: 'ADMIN' as const,
      },
    };

    // Create member using shared service
    const newMember = await memberService.createMember(data, ctx);

    return successResponse(newMember, 201);
  } catch (error: any) {
    return errorResponse(error);
  }
}

