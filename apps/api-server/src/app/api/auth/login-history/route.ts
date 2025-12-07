import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/application/auth.service';
import { loginHistoryService } from '@/server/modules/auth/application/login-history.service';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateQuery } from '@/server/http/utils/validation.helper';
import { z } from 'zod';
import { UnauthorizedException } from '@/server/common/exceptions';

/**
 * @swagger
 * /api/auth/login-history:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get login history
 *     description: Get paginated login history for the current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Login history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LoginHistoryItem'
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Unauthorized
 */
const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export async function GET(request: NextRequest) {
  try {
    // Get current user from token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const currentUser = await authService.getCurrentUser(token);

    // Parse and validate query params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = await validateQuery(QuerySchema, searchParams);

    // Get login history
    const result = await loginHistoryService.getUserLoginHistory(
      currentUser.id,
      query.page,
      query.limit
    );

    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

