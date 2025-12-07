import { NextRequest } from 'next/server';
import { adminService } from '@/server/modules/admin/application/admin.service';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateQuery } from '@/server/http/utils/validation.helper';
import { getCurrentAdminFromRequest } from '@/server/http/middleware/admin.middleware';
import { z } from 'zod';

/**
 * @swagger
 * /api/admin/dashboard/recent-users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get recent users (Admin only)
 *     description: Get list of recently created users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           minimum: 1
 *           maximum: 50
 *         description: Number of users to return
 *     responses:
 *       200:
 *         description: Recent users retrieved successfully
 *       401:
 *         description: Unauthorized
 */
const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(5),
});

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdminFromRequest(request);
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const query = await validateQuery(QuerySchema, searchParams);

    const users = await adminService.getRecentUsers(admin.id, query.limit);

    return successResponse(users);
  } catch (error: any) {
    return errorResponse(error);
  }
}

