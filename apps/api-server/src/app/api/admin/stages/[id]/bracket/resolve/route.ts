/**
 * Admin Bracket Resolve API Routes
 *
 * POST /api/admin/stages/:id/bracket/resolve - Resolve bracket slots
 */

import { NextRequest } from 'next/server';
import { BracketService } from '@/server/modules/bracket/application/bracket.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const bracketService = new BracketService();

/**
 * @swagger
 * /api/admin/stages/{id}/bracket/resolve:
 *   post:
 *     tags:
 *       - Admin - Bracket
 *     summary: Resolve bracket slots (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien resolve slot trong bracket.'
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
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    const resolvedCount = await bracketService.resolveBracket(params.id);

    return successResponse({ resolvedCount });
  } catch (error: any) {
    return errorResponse(error);
  }
}
