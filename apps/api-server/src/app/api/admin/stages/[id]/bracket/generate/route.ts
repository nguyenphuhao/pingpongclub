/**
 * Admin Bracket Generate API Routes
 *
 * POST /api/admin/stages/:id/bracket/generate - Generate bracket
 */

import { NextRequest } from 'next/server';
import { BracketService } from '@/server/modules/bracket/application/bracket.service';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { GenerateBracketDtoSchema } from '@/shared/dtos';

const bracketService = new BracketService();

/**
 * @swagger
 * /api/admin/stages/{id}/bracket/generate:
 *   post:
 *     tags:
 *       - Admin - Bracket
 *     summary: Tao bracket (Admin)
 *     description: 'Ai goi: Admin Portal. Khi nao: quan tri vien tao bracket.'
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
 *               - sourceType
 *             properties:
 *               sourceType:
 *                 type: string
 *                 enum: [CUSTOM, RANDOM, GROUP_RANK]
 *               sourceStageId:
 *                 type: string
 *               size:
 *                 type: integer
 *               seedOrder:
 *                 type: string
 *                 enum: [STANDARD, REVERSE]
 *               topNPerGroup:
 *                 type: integer
 *               wildcardCount:
 *                 type: integer
 *               bestOf:
 *                 type: integer
 *               pairs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     sideA:
 *                       type: string
 *                     sideB:
 *                       type: string
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

    const body = await request.json();
    const dto = await validateBody(GenerateBracketDtoSchema, body);

    await bracketService.generateBracket(params.id, dto);

    return successResponse({ message: 'Da tao bracket thanh cong' });
  } catch (error: any) {
    return errorResponse(error);
  }
}
