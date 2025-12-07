import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/application/auth.service';
import { LoginWithOtpDtoSchema } from '@/shared/dtos';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';

/**
 * @swagger
 * /api/auth/login/otp:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Send OTP for login
 *     description: Login by sending OTP to email OR phone number (only one, not both)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [email]
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: User's email address
 *                     example: user@example.com
 *               - type: object
 *                 required: [phoneNumber]
 *                 properties:
 *                   phoneNumber:
 *                     type: string
 *                     description: User's phone number
 *                     example: "+84901234567"
 *     responses:
 *       200:
 *         description: OTP sent successfully
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
 *                     verificationId:
 *                       type: string
 *                       description: Verification ID for OTP verification
 *                     message:
 *                       type: string
 *                       example: OTP sent to your email
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: User not found
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
 *                   example: No account found with this email
 *       401:
 *         description: Account is not active
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
 *                   example: Account is not active
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dto = await validateBody(LoginWithOtpDtoSchema, body);

    const result = await authService.loginWithOtp(dto);

    return successResponse(result, 200);
  } catch (error) {
    return errorResponse(error);
  }
}

