import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/application/auth.service';
import { ChangePasswordDtoSchema } from '@/shared/dtos';
import { validateBody } from '@/server/http/utils/validation.helper';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { getCurrentUserId } from '@/server/http/middleware/auth.middleware';

/**
 * @swagger
 * /api/auth/password/change:
 *   post:
 *     summary: Change user password
 *     description: Change password for authenticated user (requires current password)
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *                 example: "oldpassword123"
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized or invalid current password
 *       400:
 *         description: Validation error
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    const dto = await validateBody(ChangePasswordDtoSchema, body);
    
    await authService.changePassword(userId, dto.currentPassword, dto.newPassword);
    
    return successResponse({ message: 'Password changed successfully' }, 200);
  } catch (error: any) {
    return errorResponse(error);
  }
}

