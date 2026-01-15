/**
 * Admin Draw Apply API Routes
 *
 * POST /api/admin/draws/:id/apply - Apply draw session
 */

import { NextRequest } from 'next/server';
import { DrawService } from '@/server/modules/draw/application/draw.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

const drawService = new DrawService();

/**
 * @swagger
 * /api/admin/draws/{id}/apply:
 *   post:
 *     tags:
 *       - Admin - Draws
 *     summary: Ap dung phien boc tham (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: ap dung ket qua boc tham.'
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
 *       400:
 *         description: Validation error
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

    await drawService.applyDraw(params.id);

    return successResponse({ message: 'Da ap dung boc tham' });
  } catch (error: any) {
    return errorResponse(error);
  }
}
