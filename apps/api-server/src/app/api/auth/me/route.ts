import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/application/auth.service';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { UnauthorizedException } from '@/server/common/exceptions';

/**
 * GET /api/auth/me - Get current user
 * Requires: Authorization header with Bearer token
 * 
 * ✅ Trong NestJS:
 * 
 * @Get('me')
 * @UseGuards(JwtAuthGuard)
 * async getCurrentUser(@CurrentUser() user: UserEntity) {
 *   return user;
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const user = await authService.getCurrentUser(token);

    return successResponse(user.toJSON());
  } catch (error: any) {
    return errorResponse(error);
  }
}

