import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/application/auth.service';
import { VerifyRegistrationDtoSchema } from '@/shared/dtos';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';

/**
 * @swagger
 * /api/auth/register/verify:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify OTP and complete registration
 *     description: Verify the OTP code and create user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               verificationId:
 *                 type: string
 *                 description: Verification ID from registration OTP request
 *                 example: clx123456789
 *               otpCode:
 *                 type: string
 *                 description: 6-digit OTP code
 *                 example: "123456"
 *               firstName:
 *                 type: string
 *                 description: User's first name (optional)
 *                 example: John
 *               lastName:
 *                 type: string
 *                 description: User's last name (optional)
 *                 example: Doe
 *             required:
 *               - verificationId
 *               - otpCode
 *     responses:
 *       201:
 *         description: Registration successful
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
 *                     message:
 *                       type: string
 *                       example: Registration successful
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     phoneNumber:
 *                       type: string
 *                       example: "+84901234567"
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid OTP code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dto = await validateBody(VerifyRegistrationDtoSchema, body);

    const result = await authService.verifyRegistration(dto);

    return successResponse(result, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

