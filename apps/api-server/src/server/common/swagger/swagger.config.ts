import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Swagger/OpenAPI Configuration
 * 
 * Trong NestJS, file này sẽ trở thành:
 * 
 * // main.ts
 * const config = new DocumentBuilder()
 *   .setTitle('Dokifree API')
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
      title: 'Dokifree API',
      version: '1.0.0',
      description: 'API documentation for Dokifree backend',
      contact: {
        name: 'Dokifree Team',
        email: 'dev@dokifree.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.dokifree.com',
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
    './src/app/api/**/*.ts',
    './src/server/common/swagger/schemas/**/*.yaml',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

