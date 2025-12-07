import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/application/auth.service';
import { VerifyLoginDtoSchema } from '@/shared/dtos';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { extractDeviceInfo } from '@/server/http/utils/device.helper';

/**
 * @swagger
 * /api/auth/login/verify:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Verify OTP and login
 *     description: Verify the OTP code and return authentication tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               verificationId:
 *                 type: string
 *                 description: Verification ID from login OTP request
 *                 example: clx123456789
 *               otpCode:
 *                 type: string
 *                 description: 6-digit OTP code
 *                 example: "123456"
 *             required:
 *               - verificationId
 *               - otpCode
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     refreshToken:
 *                       type: string
 *                       description: Refresh token for getting new access tokens
 *                       example: clx987654321
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
 *                   example: User not found
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dto = await validateBody(VerifyLoginDtoSchema, body);

    // Extract device and request info
    const { deviceInfo, requestInfo } = extractDeviceInfo(request, body);

    const result = await authService.verifyLogin(dto, deviceInfo, requestInfo);

    return successResponse(result, 200);
  } catch (error) {
    return errorResponse(error);
  }
}

