import { NextResponse } from 'next/server';
import { ApiResponse } from '@/shared/types';
import { AppException } from '@/server/common/exceptions';

/**
 * HTTP Response Helpers
 * Chuẩn hóa format response cho tất cả API routes
 * Sau này trong NestJS: dùng Interceptor hoặc built-in response
 */

export function successResponse<T>(
  data: T,
  status: number = 200,
  meta?: Record<string, any>,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
    },
    { status },
  );
}

export function errorResponse(
  error: AppException | Error,
  status?: number,
): NextResponse<ApiResponse> {
  if (error instanceof AppException) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode },
    );
  }

  // Generic error
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Internal server error',
      },
    },
    { status: status || 500 },
  );
}

/**
 * Trong NestJS:
 * 
 * @Interceptor()
 * export class TransformInterceptor implements NestInterceptor {
 *   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
 *     return next.handle().pipe(
 *       map(data => ({ success: true, data }))
 *     );
 *   }
 * }
 * 
 * Hoặc dùng @Res() decorator và return trực tiếp
 */

