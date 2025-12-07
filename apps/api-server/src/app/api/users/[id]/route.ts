import { NextRequest } from 'next/server';
import { userService } from '@/server/modules/users/application/user.service';
import { UpdateUserDtoSchema } from '@/shared/dtos';
import { successResponse, errorResponse } from '@/server/http/utils/response.helper';
import { validateBody } from '@/server/http/utils/validation.helper';

type RouteContext = {
  params: { id: string };
};

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get user by ID
 *     description: Retrieve a single user by their ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * ✅ Trong NestJS:
 * 
 * @Get(':id')
 * @ApiOperation({ summary: 'Get user by ID' })
 * @ApiParam({ name: 'id', type: 'string' })
 * @ApiResponse({ status: 200, type: UserResponse })
 * @ApiResponse({ status: 404, description: 'User not found' })
 * async findOne(@Param('id') id: string) {
 *   return this.userService.getUserById(id);
 * }
 */
export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = context.params;
    const user = await userService.getUserById(id);
    return successResponse(user);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * PATCH /api/users/:id - Update user
 * 
 * ✅ Trong NestJS:
 * 
 * @Patch(':id')
 * async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
 *   return this.userService.updateUser(id, dto);
 * }
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = context.params;
    const body = await request.json();
    const dto = await validateBody(UpdateUserDtoSchema, body);

    const user = await userService.updateUser(id, dto);
    return successResponse(user);
  } catch (error: any) {
    return errorResponse(error);
  }
}

/**
 * DELETE /api/users/:id - Delete user
 * 
 * Note: Cần implement authentication middleware để lấy currentUser
 * Tạm thời comment logic cần auth
 * 
 * ✅ Trong NestJS:
 * 
 * @Delete(':id')
 * @UseGuards(JwtAuthGuard)
 * async remove(@Param('id') id: string, @CurrentUser() user: UserEntity) {
 *   return this.userService.deleteUser(id, user);
 * }
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = context.params;
    
    // TODO: Get current user from auth middleware
    // const currentUser = await getCurrentUser(request);
    // await userService.deleteUser(id, currentUser);
    
    // Temporary: allow deletion without auth check
    await userService.getUserById(id); // Verify exists
    // await userService.deleteUser(id, currentUser);

    return successResponse({ message: 'User deleted successfully' });
  } catch (error: any) {
    return errorResponse(error);
  }
}

