/**
 * Admin Stage Rules API Routes
 *
 * GET /api/admin/stages/:id/rules - Get stage rules
 * POST /api/admin/stages/:id/rules - Create stage rules
 * PATCH /api/admin/stages/:id/rules - Update stage rules
 * DELETE /api/admin/stages/:id/rules - Delete stage rules
 */

import { NextRequest } from 'next/server';
import { StageService } from '@/server/modules/stage/application/stage.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { CreateStageRuleDtoSchema, UpdateStageRuleDtoSchema } from '@/shared/dtos';

const stageService = new StageService();

/**
 * @swagger
 * /api/admin/stages/{id}/rules:
 *   get:
 *     tags:
 *       - Admin - Stage Rules
 *     summary: Chi tiet stage rules (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xem stage rules.'
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

    const rule = await stageService.getStageRule(params.id);

    return successResponse(rule);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/stages/{id}/rules:
 *   post:
 *     tags:
 *       - Admin - Stage Rules
 *     summary: Tao stage rules (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien tao stage rules.'
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
 *             required:
 *               - tieBreakOrder
 *               - h2hMode
 *             properties:
 *               winPoints:
 *                 type: integer
 *                 default: 1
 *               lossPoints:
 *                 type: integer
 *                 default: 0
 *               byePoints:
 *                 type: integer
 *                 default: 1
 *               countByeGamesPoints:
 *                 type: boolean
 *                 default: false
 *               countWalkoverAsPlayed:
 *                 type: boolean
 *                 default: true
 *               tieBreakOrder:
 *                 type: array
 *                 items:
 *                   type: string
 *               h2hMode:
 *                 type: string
 *                 enum: [TWO_WAY_ONLY, MINI_TABLE]
 *     responses:
 *       201:
 *         description: Created
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

    const body = await request.json();
    const dto = await validateBody(CreateStageRuleDtoSchema, body);

    const created = await stageService.createStageRule(params.id, dto);

    return successResponse(created, 201);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/stages/{id}/rules:
 *   patch:
 *     tags:
 *       - Admin - Stage Rules
 *     summary: Cap nhat stage rules (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien cap nhat stage rules.'
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
 *               winPoints:
 *                 type: integer
 *               lossPoints:
 *                 type: integer
 *               byePoints:
 *                 type: integer
 *               countByeGamesPoints:
 *                 type: boolean
 *               countWalkoverAsPlayed:
 *                 type: boolean
 *               tieBreakOrder:
 *                 type: array
 *                 items:
 *                   type: string
 *               h2hMode:
 *                 type: string
 *                 enum: [TWO_WAY_ONLY, MINI_TABLE]
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
    const dto = await validateBody(UpdateStageRuleDtoSchema, body);

    const updated = await stageService.updateStageRule(params.id, dto);

    return successResponse(updated);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/stages/{id}/rules:
 *   delete:
 *     tags:
 *       - Admin - Stage Rules
 *     summary: Xoa stage rules (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xoa stage rules.'
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

    await stageService.deleteStageRule(params.id);

    return successResponse({ message: 'Da xoa stage rules thanh cong' });
  } catch (error: any) {
    return errorResponse(error);
  }
}
