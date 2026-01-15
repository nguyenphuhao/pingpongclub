/**
 * Admin Draw Detail API Routes
 *
 * GET /api/admin/draws/:id - Get draw detail
 * PATCH /api/admin/draws/:id - Update draw
 */

import { NextRequest } from 'next/server';
import { DrawService } from '@/server/modules/draw/application/draw.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { UpdateDrawDtoSchema } from '@/shared/dtos';

const drawService = new DrawService();

/**
 * @swagger
 * /api/admin/draws/{id}:
 *   get:
 *     tags:
 *       - Admin - Draws
 *     summary: Chi tiet phien boc tham (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: xem chi tiet phien boc tham.'
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

    const draw = await drawService.getDrawById(params.id);

    return successResponse(draw);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/draws/{id}:
 *   patch:
 *     tags:
 *       - Admin - Draws
 *     summary: Cap nhat phien boc tham (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: cap nhat phien boc tham.'
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
 *               payload:
 *                 type: object
 *               result:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [DRAFT, APPLIED, CANCELLED]
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    const body = await request.json();
    const dto = await validateBody(UpdateDrawDtoSchema, body);

    const draw = await drawService.updateDraw(params.id, dto);

    return successResponse(draw);
  } catch (error: any) {
    return errorResponse(error);
  }
}
