/**
 * Member Detail API Routes (Mobile App & Public)
 * 
 * GET /api/members/:id - Get member details
 * PATCH /api/members/:id - Update member profile
 */

import { NextRequest } from 'next/server';
import { MemberService } from '@/server/modules/member/application/member.service';
import { getCurrentUserFromRequest } from '@/server/http/middleware/auth.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const memberService = new MemberService();

/**
 * @swagger
 * /api/members/{id}:
 *   get:
 *     tags:
 *       - Members
 *     summary: Get member details
 *     description: Get detailed information about a specific member
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
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Member not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const currentUser = await getCurrentUserFromRequest(request);

    // Build request context
    const ctx = {
      user: {
        id: currentUser.id,
        role: currentUser.role,
      },
      targetUserId: params.id,
    };

    // Get member using shared service (with permission checks)
    const member = await memberService.getMemberById(params.id, ctx);

    return successResponse(member);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/members/{id}:
 *   patch:
 *     tags:
 *       - Members
 *     summary: Update member profile
 *     description: Update member profile (users can only update their own profile)
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
 *             properties:
 *               nickname:
 *                 type: string
 *               displayName:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               playStyle:
 *                 type: string
 *               bio:
 *                 type: string
 *               profileVisibility:
 *                 type: string
 *                 enum: [PUBLIC, MEMBERS, PRIVATE]
 *               showPhone:
 *                 type: boolean
 *               showEmail:
 *                 type: boolean
 *               showRating:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (cannot edit other users' profiles)
 *       404:
 *         description: Member not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const currentUser = await getCurrentUserFromRequest(request);

    // Parse request body
    const updates = await request.json();

    // Build request context
    const ctx = {
      user: {
        id: currentUser.id,
        role: currentUser.role,
      },
      targetUserId: params.id,
    };

    // Update member using shared service (with permission checks and field filtering)
    const updatedMember = await memberService.updateMember(params.id, updates, ctx);

    return successResponse(updatedMember);
  } catch (error: any) {
    return errorResponse(error);
  }
}

