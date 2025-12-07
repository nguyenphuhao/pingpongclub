import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/application/auth.service';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';
import { ForceLogoutAllDtoSchema } from '@/shared/dtos';
import { UnauthorizedException } from '@/server/common/exceptions';

/**
 * @swagger
 * /api/auth/sessions:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get active sessions
 *     description: Get all active sessions for the current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active sessions
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
 *                     sessions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ActiveSession'
 *                     total:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user from token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const currentUser = await authService.getCurrentUser(token);
    const sessions = await authService.getActiveSessions(currentUser.id);

    // Mark current session - try to get from refresh token if provided in body/header
    const refreshToken = request.headers.get('x-refresh-token');
    let currentTokenId: string | null = null;
    
    if (refreshToken) {
      const { authRepository } = await import('@/server/modules/auth/infrastructure/auth.repository');
      const tokenRecord = await authRepository.findRefreshToken(refreshToken);
      if (tokenRecord) {
        currentTokenId = tokenRecord.id;
      }
    }

    const sessionsWithCurrent = sessions.map((session) => ({
      ...session,
      isCurrent: currentTokenId ? session.id === currentTokenId : false,
    }));

    return successResponse({
      sessions: sessionsWithCurrent,
      total: sessionsWithCurrent.length,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * @swagger
 * /api/auth/sessions:
 *   delete:
 *     tags:
 *       - Auth
 *     summary: Force logout all devices
 *     description: Logout from all devices (optionally exclude current device)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               excludeCurrent:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to exclude current device from logout
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                       example: "Logged out from 2 devices"
 *                     loggedOutCount:
 *                       type: integer
 *                       example: 2
 *       401:
 *         description: Unauthorized
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get current user from token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const currentUser = await authService.getCurrentUser(token);
    
    // Parse body (optional)
    let excludeCurrent = true;
    try {
      const body = await request.json();
      const dto = await validateBody(ForceLogoutAllDtoSchema, body);
      excludeCurrent = dto.excludeCurrent !== false;
    } catch {
      // No body provided, use default
    }

    const loggedOutCount = await authService.forceLogoutAllDevices(
      currentUser.id,
      excludeCurrent ? token : undefined
    );

    return successResponse({
      message: `Logged out from ${loggedOutCount} device(s)`,
      loggedOutCount,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

