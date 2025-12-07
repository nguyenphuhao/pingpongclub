import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/server/common/swagger/swagger.config';

/**
 * GET /api/docs - Swagger/OpenAPI JSON spec
 * 
 * Returns the OpenAPI specification in JSON format
 * Used by Swagger UI to render documentation
 */
export async function GET() {
  return NextResponse.json(swaggerSpec);
}

