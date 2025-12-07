import { NextRequest } from 'next/server';
import { adminService } from '@/server/modules/admin/application/admin.service';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { z } from 'zod';

/**
 * @swagger
 * /api/admin/auth/login:
 *   post:
 *     tags:
 *       - Admin
 *     summary: Admin login
 *     description: Authenticate admin with username and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
const LoginDtoSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dto = await validateBody(LoginDtoSchema, body);

    const result = await adminService.login(dto.username, dto.password);

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}

