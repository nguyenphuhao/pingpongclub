import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/application/auth.service';
import { FirebaseAuthDtoSchema } from '@/shared/dtos';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { extractDeviceInfo } from '@/server/http/utils/device.helper';

/**
 * @swagger
 * /api/auth/firebase:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Authenticate with Firebase
 *     description: Login or register using Firebase ID token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FirebaseAuthDto'
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FirebaseAuthResponse'
 *       401:
 *         description: Invalid Firebase token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * ✅ Trong NestJS:
 * 
 * @Post('firebase')
 * @ApiOperation({ summary: 'Authenticate with Firebase' })
 * @ApiBody({ type: FirebaseAuthDto })
 * @ApiResponse({ status: 200, type: FirebaseAuthResponse })
 * async authenticateWithFirebase(@Body() dto: FirebaseAuthDto) {
 *   return this.authService.authenticateWithFirebase(dto);
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dto = await validateBody(FirebaseAuthDtoSchema, body);

    // Extract device and request info
    const { deviceInfo, requestInfo } = extractDeviceInfo(request, body);

    const result = await authService.authenticateWithFirebase(dto, deviceInfo, requestInfo);

    return successResponse(result, 200);
  } catch (error: any) {
    return errorResponse(error);
  }
}

