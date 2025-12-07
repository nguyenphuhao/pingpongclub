import { NextRequest } from 'next/server';
import { authService } from '@/server/modules/auth/application/auth.service';
import { UserEntity } from '@/server/modules/users/domain/user.entity';
import { UnauthorizedException, ForbiddenException } from '@/server/common/exceptions';
import { UserRole } from '@/shared/types';

/**
 * Auth Middleware Helpers
 * Sau này trong NestJS: sẽ trở thành Guards và Decorators
 */

/**
 * Extract and verify token from request
 * 
 * ✅ Trong NestJS:
 * 
 * @Injectable()
 * export class JwtAuthGuard extends AuthGuard('jwt') {}
 * 
 * @UseGuards(JwtAuthGuard)
 * @Get('protected')
 * async protectedRoute(@CurrentUser() user: UserEntity) {
 *   return user;
 * }
 */
export async function getCurrentUserFromRequest(request: NextRequest): Promise<UserEntity> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  const user = await authService.getCurrentUser(token);

  return user;
}

/**
 * Check if user has required role
 */
export function requireRole(user: UserEntity, ...roles: UserRole[]) {
  if (!roles.includes(user.role)) {
    throw new ForbiddenException(`Requires one of roles: ${roles.join(', ')}`);
  }
}

/**
 * Check if user is admin
 */
export function requireAdmin(user: UserEntity) {
  if (!user.isAdmin()) {
    throw new ForbiddenException('Admin access required');
  }
}

/**
 * Check if user is moderator or admin
 */
export function requireModerator(user: UserEntity) {
  if (!user.isModerator()) {
    throw new ForbiddenException('Moderator access required');
  }
}

/**
 * Trong NestJS, những functions này sẽ trở thành:
 * 
 * // Guards
 * @Injectable()
 * export class RolesGuard implements CanActivate {
 *   constructor(private reflector: Reflector) {}
 *   
 *   canActivate(context: ExecutionContext): boolean {
 *     const roles = this.reflector.get<UserRole[]>('roles', context.getHandler());
 *     const request = context.switchToHttp().getRequest();
 *     const user = request.user;
 *     return roles.some(role => user.role === role);
 *   }
 * }
 * 
 * // Decorators
 * export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
 * 
 * export const CurrentUser = createParamDecorator(
 *   (data: unknown, ctx: ExecutionContext) => {
 *     const request = ctx.switchToHttp().getRequest();
 *     return request.user;
 *   }
 * );
 * 
 * // Usage
 * @Get('admin-only')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(UserRole.ADMIN)
 * async adminRoute(@CurrentUser() user: UserEntity) {
 *   return { message: 'Admin access granted' };
 * }
 */

