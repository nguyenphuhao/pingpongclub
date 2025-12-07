import { NextRequest } from 'next/server';
import { userService } from '@/server/modules/users/application/user.service';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';

type RouteContext = {
  params: { id: string };
};

/**
 * GET /api/users/:id/profile - Get user public profile
 * 
 * ✅ Trong NestJS:
 * 
 * @Get(':id/profile')
 * async getProfile(@Param('id') id: string) {
 *   return this.userService.getUserProfile(id);
 * }
 */
export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = context.params;
    const profile = await userService.getUserProfile(id);
    return successResponse(profile);
  } catch (error: any) {
    return errorResponse(error);
  }
}

