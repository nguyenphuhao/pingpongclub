/**
 * Admin Stage Rule Presets API Routes
 *
 * GET /api/admin/stage-rule-presets - List presets
 * POST /api/admin/stage-rule-presets - Create preset
 */

import { NextRequest } from 'next/server';
import { StageRulePresetService } from '@/server/modules/stage-rule-preset/application/stage-rule-preset.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody, validateQuery } from '@/server/http/utils/validation.helper';
import {
  CreateStageRulePresetDtoSchema,
  QueryStageRulePresetsDtoSchema,
} from '@/shared/dtos';

const presetService = new StageRulePresetService();

/**
 * @swagger
 * /api/admin/stage-rule-presets:
 *   get:
 *     tags:
 *       - Admin - Stage Rule Presets
 *     summary: Danh sach stage rule presets (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien xem danh sach preset.'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name]
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await getCurrentAdminFromRequest(request);

    const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
    const query = validateQuery(QueryStageRulePresetsDtoSchema, rawQuery);

    const result = await presetService.getPresets(query);

    return successResponse(result.data, 200, result.pagination);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/admin/stage-rule-presets:
 *   post:
 *     tags:
 *       - Admin - Stage Rule Presets
 *     summary: Tao stage rule preset (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien tao preset.'
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - tieBreakOrder
 *               - h2hMode
 *               - qualifyMode
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
 *       201:
 *         description: Created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await getCurrentAdminFromRequest(request);

    const body = await request.json();
    const dto = await validateBody(CreateStageRulePresetDtoSchema, body);

    const created = await presetService.createPreset(dto);

    return successResponse(created, 201);
  } catch (error: any) {
    return errorResponse(error);
  }
}
