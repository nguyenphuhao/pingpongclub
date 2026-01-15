/**
 * Admin Bracket API Routes
 *
 * GET /api/admin/stages/:id/bracket - Get bracket
 */

import { NextRequest } from 'next/server';
import { BracketService } from '@/server/modules/bracket/application/bracket.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const bracketService = new BracketService();

/**
 * @swagger
 * /api/admin/stages/{id}/bracket:
 *   get:
 *     tags:
 *       - Admin - Bracket
 *     summary: Lay bracket theo stage (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xem bracket.'
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
 *         description: Not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    const bracket = await bracketService.getBracket(params.id);

    return successResponse(bracket);
  } catch (error: any) {
    return errorResponse(error);
  }
}
