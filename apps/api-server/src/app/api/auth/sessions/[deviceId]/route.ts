import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/application/auth.service';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { UnauthorizedException } from '@/server/common/exceptions';

/**
 * @swagger
 * /api/auth/sessions/{deviceId}:
 *   delete:
 *     tags:
 *       - Auth
 *     summary: Force logout specific device
 *     description: Logout from a specific device by device ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID to logout
 *     responses:
 *       200:
 *         description: Device logged out successfully
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
 *                       example: "Device logged out successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Device session not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  try {
    // Get current user from token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const currentUser = await authService.getCurrentUser(token);
    const { deviceId } = params;

    await authService.forceLogoutDevice(currentUser.id, deviceId);

    return successResponse({
      message: 'Device logged out successfully',
    });
  } catch (error) {
    return errorResponse(error);
  }
}

