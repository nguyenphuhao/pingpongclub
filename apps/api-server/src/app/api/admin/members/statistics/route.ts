/**
 * Admin Members Statistics API Route
 * 
 * GET /api/admin/members/statistics - Get member statistics
 */

import { NextRequest } from 'next/server';
import { MemberService } from '@/server/modules/member/application/member.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const memberService = new MemberService();

/**
 * @swagger
 * /api/admin/members/statistics:
 *   get:
 *     tags:
 *       - Admin - Members
 *     summary: Get member statistics (Admin)
 *     description: Get comprehensive statistics about club members
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalMembers:
 *                   type: integer
 *                 activeMembers:
 *                   type: integer
 *                 newMembersThisMonth:
 *                   type: integer
 *                 averageRating:
 *                   type: number
 *                 rankDistribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: string
 *                       count:
 *                         type: integer
 *                       percentage:
 *                         type: number
 *                 genderDistribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       gender:
 *                         type: string
 *                       count:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin
    const currentAdmin = await getCurrentAdminFromRequest(request);

    // Build request context (treat admin as ADMIN role)
    const ctx = {
      user: {
        id: currentAdmin.id,
        role: 'ADMIN' as const,
      },
    };

    // Get statistics using shared service
    const statistics = await memberService.getStatistics(ctx);

    return successResponse(statistics);
  } catch (error: any) {
    return errorResponse(error);
  }
}

