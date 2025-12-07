import { NextRequest } from 'next/server';
import { adminService } from '@/server/modules/admin/application/admin.service';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateQuery } from '@/server/http/utils/validation.helper';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { z } from 'zod';

type RouteContext = {
  params: { id: string };
};

/**
 * @swagger
 * /api/admin/users/{id}/login-history:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get user login history (Admin only)
 *     description: Get login history for any user by admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
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
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Login history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const admin = await getCurrentAdminFromRequest(request);
    const { id } = context.params;
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = await validateQuery(QuerySchema, searchParams);

    const result = await adminService.getUserLoginHistory(
      id,
      admin.id,
      query.page,
      query.limit
    );

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}

