import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/application/auth.service';
import { LoginDtoSchema } from '@/shared/dtos';
import { validateBody } from '@/server/http/utils/validation.helper';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { getDeviceInfo, getRequestInfo } from '@/server/http/utils/device.helper';

/**
 * @swagger
 * /api/auth/login/password:
 *   post:
 *     summary: Login with email or phone + password
 *     description: Authenticate user with email or phone number and password
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email (required if phoneNumber is not provided)
 *                 example: user@example.com
 *               phoneNumber:
 *                 type: string
 *                 description: User phone number (required if email is not provided)
 *                 example: "+84901234567"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: User password
 *                 example: "password123"
 *               rememberMe:
 *                 type: boolean
 *                 description: Remember user session
 *                 default: false
 *               deviceInfo:
 *                 type: object
 *                 description: Device information for session tracking
 *                 properties:
 *                   fcmToken:
 *                     type: string
 *                     description: Firebase Cloud Messaging token
 *                   platform:
 *                     type: string
 *                     enum: [IOS, ANDROID, WEB]
 *                     description: Device platform
 *                   deviceId:
 *                     type: string
 *                     description: Unique device identifier
 *                   model:
 *                     type: string
 *                     description: Device model
 *                   osVersion:
 *                     type: string
 *                     description: Operating system version
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
 *                     refreshToken:
 *                       type: string
 *                       description: Refresh token for getting new access tokens
 *                     expiresIn:
 *                       type: number
 *                       description: Token expiration time in seconds
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials or account not active
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const dto = await validateBody(LoginDtoSchema, body);
    
    // Get device and request info
    const deviceInfo = getDeviceInfo(request, dto.deviceInfo);
    const requestInfo = getRequestInfo(request);
    
    // Login with password
    const result = await authService.loginWithPassword(dto, deviceInfo, requestInfo);
    
    return successResponse(result, 200);
  } catch (error: any) {
    return errorResponse(error);
  }
}

