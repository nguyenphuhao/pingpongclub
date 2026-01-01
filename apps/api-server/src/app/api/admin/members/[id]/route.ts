/**
 * Admin Member Detail API Routes
 * 
 * GET /api/admin/members/:id - Get member details (admin view)
 * PATCH /api/admin/members/:id - Update member
 * DELETE /api/admin/members/:id - Delete member (soft delete)
 */

import { NextRequest } from 'next/server';
import { MemberService } from '@/server/modules/member/application/member.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const memberService = new MemberService();

/**
 * @swagger
 * /api/admin/members/{id}:
 *   get:
 *     tags:
 *       - Admin - Members
 *     summary: Get member details (Admin)
 *     description: Get detailed information about a specific member with full admin data
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
 *         description: Forbidden (admin only)
 *       404:
 *         description: Member not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate admin
    const currentAdmin = await getCurrentAdminFromRequest(request);

    // Build request context (treat admin as ADMIN role)
    const ctx = {
      user: {
        id: currentAdmin.id,
        role: 'ADMIN' as const,
      },
      targetUserId: params.id,
    };

    // Get member using shared service (admin gets full data)
    const member = await memberService.getMemberById(params.id, ctx);

    return successResponse(member);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/members/{id}:
 *   patch:
 *     tags:
 *       - Admin - Members
 *     summary: Update member (Admin)
 *     description: Update member profile with admin privileges
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
 *               email:
 *                 type: string
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
 *               dateOfBirth:
 *                 type: string
 *                 format: date
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
 *               adminNotes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *               profileVisibility:
 *                 type: string
 *                 enum: [PUBLIC, MEMBERS, PRIVATE]
 *     responses:
 *       200:
 *         description: Updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Member not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate admin
    const currentAdmin = await getCurrentAdminFromRequest(request);

    // Parse request body
    const updates = await request.json();

    // Build request context (treat admin as ADMIN role)
    const ctx = {
      user: {
        id: currentAdmin.id,
        role: 'ADMIN' as const,
      },
      targetUserId: params.id,
    };

    // Update member using shared service (admin can edit all fields)
    const updatedMember = await memberService.updateMember(params.id, updates, ctx);

    return successResponse(updatedMember);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/members/{id}:
 *   delete:
 *     tags:
 *       - Admin - Members
 *     summary: Delete member (Admin)
 *     description: Soft delete a member
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
 *         description: Member deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Member not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate admin
    const currentAdmin = await getCurrentAdminFromRequest(request);

    // Build request context (treat admin as ADMIN role)
    const ctx = {
      user: {
        id: currentAdmin.id,
        role: 'ADMIN' as const,
      },
      targetUserId: params.id,
    };

    // Delete member using shared service
    await memberService.deleteMember(params.id, ctx);

    return successResponse({ message: 'Member deleted successfully' });
  } catch (error: any) {
    return errorResponse(error);
  }
}

