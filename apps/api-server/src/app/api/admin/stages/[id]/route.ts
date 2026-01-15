/**
 * Admin Stage Detail API Routes
 *
 * GET /api/admin/stages/:id - Get stage detail
 * PATCH /api/admin/stages/:id - Update stage
 * DELETE /api/admin/stages/:id - Delete stage
 */

import { NextRequest } from 'next/server';
import { StageService } from '@/server/modules/stage/application/stage.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { UpdateStageDtoSchema } from '@/shared/dtos';

const stageService = new StageService();

/**
 * @swagger
 * /api/admin/stages/{id}:
 *   get:
 *     tags:
 *       - Admin - Stages
 *     summary: Chi tiet stage (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xem chi tiet stage.'
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

    const stage = await stageService.getStageById(params.id);

    return successResponse(stage);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/stages/{id}:
 *   patch:
 *     tags:
 *       - Admin - Stages
 *     summary: Cap nhat stage (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien cap nhat stage.'
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
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [GROUP, KNOCKOUT]
 *               stageOrder:
 *                 type: integer
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
    const dto = await validateBody(UpdateStageDtoSchema, body);

    const updated = await stageService.updateStage(params.id, dto);

    return successResponse(updated);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/stages/{id}:
 *   delete:
 *     tags:
 *       - Admin - Stages
 *     summary: Xoa stage (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xoa stage.'
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
 *         description: Deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await getCurrentAdminFromRequest(request);

    await stageService.deleteStage(params.id);

    return successResponse({ message: 'Da xoa stage thanh cong' });
  } catch (error: any) {
    return errorResponse(error);
  }
}
