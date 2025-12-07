import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/application/auth.service';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { getCurrentUserId } from '@/server/http/middleware/auth.middleware';
import { z } from 'zod';
import { validateBody } from '@/server/http/utils/validation.helper';

const SetPasswordDtoSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * @swagger
 * /api/auth/password/set:
 *   post:
 *     summary: Set password for user (first time)
 *     description: Set a password for user who doesn't have one yet
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
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password set successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation error
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    const dto = await validateBody(SetPasswordDtoSchema, body);
    
    await authService.setPassword(userId, dto.newPassword);
    
    return successResponse({ message: 'Password set successfully' }, 200);
  } catch (error: any) {
    return errorResponse(error);
  }
}

