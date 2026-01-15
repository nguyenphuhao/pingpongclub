/**
 * Admin Stage Rule Preset Detail API Routes
 *
 * GET /api/admin/stage-rule-presets/:id - Get preset detail
 * PATCH /api/admin/stage-rule-presets/:id - Update preset
 * DELETE /api/admin/stage-rule-presets/:id - Delete preset
 */

import { NextRequest } from 'next/server';
import { StageRulePresetService } from '@/server/modules/stage-rule-preset/application/stage-rule-preset.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { UpdateStageRulePresetDtoSchema } from '@/shared/dtos';

const presetService = new StageRulePresetService();

/**
 * @swagger
 * /api/admin/stage-rule-presets/{id}:
 *   get:
 *     tags:
 *       - Admin - Stage Rule Presets
 *     summary: Chi tiet stage rule preset (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xem chi tiet preset.'
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

    const preset = await presetService.getPresetById(params.id);

    return successResponse(preset);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/stage-rule-presets/{id}:
 *   patch:
 *     tags:
 *       - Admin - Stage Rule Presets
 *     summary: Cap nhat stage rule preset (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien cap nhat preset.'
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
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *                 nullable: true
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
 *               qualifyMode:
 *                 type: string
 *                 enum: [TOP_N_PER_GROUP, TOP_N_OVERALL, TOP_N_AND_WILDCARD]
 *               topNPerGroup:
 *                 type: integer
 *                 nullable: true
 *               topNOverall:
 *                 type: integer
 *                 nullable: true
 *               wildcardCount:
 *                 type: integer
 *               isActive:
 *                 type: boolean
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
    const dto = await validateBody(UpdateStageRulePresetDtoSchema, body);

    const updated = await presetService.updatePreset(params.id, dto);

    return successResponse(updated);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/stage-rule-presets/{id}:
 *   delete:
 *     tags:
 *       - Admin - Stage Rule Presets
 *     summary: Xoa stage rule preset (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xoa preset.'
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

    await presetService.deletePreset(params.id);

    return successResponse({ message: 'Đã xóa preset thành công' });
  } catch (error: any) {
    return errorResponse(error);
  }
}
