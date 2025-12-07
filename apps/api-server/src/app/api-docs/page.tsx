'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Dynamic import to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

/**
 * Swagger UI Page
 * 
 * Trong NestJS, Swagger UI được setup tự động:
 * SwaggerModule.setup('api/docs', app, document);
 */
export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI url="/api/docs" />
    </div>
  );
}

