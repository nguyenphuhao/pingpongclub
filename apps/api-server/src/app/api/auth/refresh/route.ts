import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/application/auth.service';
import { RefreshTokenDtoSchema } from '@/shared/dtos';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';

/**
 * POST /api/auth/refresh - Refresh access token
 * 
 * ✅ Trong NestJS:
 * 
 * @Post('refresh')
 * async refresh(@Body() dto: RefreshTokenDto) {
 *   return this.authService.refreshAccessToken(dto);
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dto = await validateBody(RefreshTokenDtoSchema, body);

    const result = await authService.refreshAccessToken(dto);

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error);
  }
}

