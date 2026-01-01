/**
 * Environment configuration
 * Trong NestJS: sẽ dùng @nestjs/config ConfigModule
 */

export const env = {
  // App
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  API_URL: process.env.API_URL || 'http://localhost:3000/api',

  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // Firebase
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID!,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Email (SendGrid)
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@pingclub.com',

  // SMS (Twilio)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,

  // Redis (optional)
  REDIS_URL: process.env.REDIS_URL,

  // Mock Notification Server (for local development)
  USE_MOCK_SERVER: process.env.USE_MOCK_SERVER,
  MOCK_SERVER_URL: process.env.MOCK_SERVER_URL || 'http://localhost:9000',
} as const;

export type Env = typeof env;

/**
 * Validate required environment variables
 */
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

/**
 * Trong NestJS, file này sẽ trở thành:
 * 
 * config/configuration.ts:
 * export default () => ({
 *   app: { url: process.env.APP_URL, ... },
 *   database: { url: process.env.DATABASE_URL },
 *   firebase: { ... },
 * });
 * 
 * app.module.ts:
 * ConfigModule.forRoot({
 *   load: [configuration],
 *   validate: validateEnv,
 * })
 */

