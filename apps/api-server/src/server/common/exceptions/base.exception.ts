/**
 * Custom exceptions - tương thích với NestJS HttpException
 * Sau này trong NestJS: extend từ HttpException hoặc dùng built-in exceptions
 */

export enum ErrorCode {
  // General
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  
  // Auth
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // User
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  PHONE_ALREADY_EXISTS = 'PHONE_ALREADY_EXISTS',
  
  // Notification
  NOTIFICATION_SEND_FAILED = 'NOTIFICATION_SEND_FAILED',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
}

export class AppException extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly details?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// ============================================
// Specific exceptions
// ============================================

export class BadRequestException extends AppException {
  constructor(message: string = 'Bad Request', details?: any) {
    super(ErrorCode.BAD_REQUEST, message, 400, details);
  }
}

export class ValidationException extends AppException {
  constructor(message: string = 'Validation failed', details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, 400, details);
  }
}

export class UnauthorizedException extends AppException {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(ErrorCode.UNAUTHORIZED, message, 401, details);
  }
}

export class ForbiddenException extends AppException {
  constructor(message: string = 'Forbidden', details?: any) {
    super(ErrorCode.FORBIDDEN, message, 403, details);
  }
}

export class NotFoundException extends AppException {
  constructor(message: string = 'Not Found', details?: any) {
    super(ErrorCode.NOT_FOUND, message, 404, details);
  }
}

export class UserNotFoundException extends AppException {
  constructor(message: string = 'User not found') {
    super(ErrorCode.USER_NOT_FOUND, message, 404);
  }
}

export class UserAlreadyExistsException extends AppException {
  constructor(message: string = 'User already exists') {
    super(ErrorCode.USER_ALREADY_EXISTS, message, 409);
  }
}

export class InvalidCredentialsException extends AppException {
  constructor(message: string = 'Invalid credentials') {
    super(ErrorCode.INVALID_CREDENTIALS, message, 401);
  }
}

export class TokenExpiredException extends AppException {
  constructor(message: string = 'Token has expired') {
    super(ErrorCode.TOKEN_EXPIRED, message, 401);
  }
}

export class InvalidTokenException extends AppException {
  constructor(message: string = 'Invalid token') {
    super(ErrorCode.INVALID_TOKEN, message, 401);
  }
}

/**
 * Trong NestJS, những exception này sẽ map sang:
 * - BadRequestException → new BadRequestException()
 * - UnauthorizedException → new UnauthorizedException()
 * - NotFoundException → new NotFoundException()
 * v.v...
 * 
 * Hoặc giữ nguyên custom exceptions và dùng ExceptionFilter
 */

