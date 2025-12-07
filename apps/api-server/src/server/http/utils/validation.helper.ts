import { ZodSchema, ZodError } from 'zod';
import { ValidationException } from '@/server/common/exceptions';

/**
 * Validation helpers using Zod
 * Sau này trong NestJS: dùng class-validator hoặc ZodValidationPipe
 */

export async function validateBody<T>(schema: ZodSchema<T>, data: unknown): Promise<T> {
  try {
    const result = await schema.parseAsync(data);
    console.log('🔍 [VALIDATION DEBUG] Validation passed:', result);
    return result;
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('🔍 [VALIDATION DEBUG] Validation failed:', {
        errors: error.errors,
        input: data,
      });
      throw new ValidationException('Validation failed', error.errors);
    }
    throw error;
  }
}

export function validateQuery<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationException('Query validation failed', error.errors);
    }
    throw error;
  }
}

/**
 * Trong NestJS:
 * 
 * // Sử dụng ValidationPipe built-in với class-validator
 * app.useGlobalPipes(new ValidationPipe({
 *   whitelist: true,
 *   transform: true,
 * }));
 * 
 * // Hoặc tạo custom ZodValidationPipe
 * @Injectable()
 * export class ZodValidationPipe implements PipeTransform {
 *   constructor(private schema: ZodSchema) {}
 *   
 *   transform(value: any) {
 *     try {
 *       return this.schema.parse(value);
 *     } catch (error) {
 *       throw new BadRequestException('Validation failed');
 *     }
 *   }
 * }
 */

