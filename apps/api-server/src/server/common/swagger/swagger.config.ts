import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

/**
 * Swagger/OpenAPI Configuration
 * 
 * Trong NestJS, file này sẽ trở thành:
 * 
 * // main.ts
 * const config = new DocumentBuilder()
 *   .setTitle('Pingclub API')
 *   .setDescription('API documentation')
 *   .setVersion('1.0')
 *   .addBearerAuth()
 *   .build();
 * 
 * const document = SwaggerModule.createDocument(app, config);
 * SwaggerModule.setup('api/docs', app, document);
 */

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pingclub API',
      version: '1.0.0',
      description: 'API documentation for Pingclub backend',
      contact: {
        name: 'Pingclub Team',
        email: 'dev@pingclub.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.pingclub.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {}, // Will be populated from schema files
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Notifications',
        description: 'Notification endpoints',
      },
    ],
  },
  apis: [
    path.join(process.cwd(), 'src', 'app', 'api', '**', '*.ts'),
    path.join(process.cwd(), 'src', 'server', 'common', 'swagger', 'schemas', '**', '*.yaml'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
