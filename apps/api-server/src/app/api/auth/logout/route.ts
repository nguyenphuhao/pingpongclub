import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/application/auth.service';
import { RefreshTokenDtoSchema } from '@/shared/dtos';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';

/**
 * POST /api/auth/logout - Logout (invalidate refresh token)
 * 
 * ✅ Trong NestJS:
 * 
 * @Post('logout')
 * async logout(@Body() dto: RefreshTokenDto) {
 *   await this.authService.logout(dto.refreshToken);
 *   return { message: 'Logged out successfully' };
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dto = await validateBody(RefreshTokenDtoSchema, body);

    await authService.logout(dto.refreshToken);

    return successResponse({ message: 'Logged out successfully' });
  } catch (error: any) {
    return errorResponse(error);
  }
}

