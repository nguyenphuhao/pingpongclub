/**
 * Environment Configuration
 * Access environment-specific settings via expo-constants
 */

import Constants from 'expo-constants';

interface AppConfig {
  environment: 'staging' | 'production';
  apiUrl: string;
  enableDebugMode: boolean;
  enableAnalytics: boolean;
  isStaging: boolean;
  isProduction: boolean;
}

const extra = Constants.expoConfig?.extra || {};

const ENV: AppConfig = {
  environment: (extra.environment as 'staging' | 'production') || 'production',
  apiUrl: extra.apiUrl || 'https://api.pingclub.com',
  enableDebugMode: extra.enableDebugMode || false,
  enableAnalytics: extra.enableAnalytics || false,
  isStaging: extra.environment === 'staging',
  isProduction: extra.environment === 'production',
};

/**
 * Log current environment information
 * Useful for debugging
 */
export const logEnvironment = () => {
  console.log('=====================================');
  console.log('🚀 PINGCLUB APP ENVIRONMENT');
  console.log('=====================================');
  console.log('Environment:', ENV.environment.toUpperCase());
  console.log('API URL:', ENV.apiUrl);
  console.log('Debug Mode:', ENV.enableDebugMode ? 'ENABLED' : 'DISABLED');
  console.log('Analytics:', ENV.enableAnalytics ? 'ENABLED' : 'DISABLED');
  console.log('=====================================');
};

/**
 * Get API endpoint with path
 */
export const getApiEndpoint = (path: string): string => {
  return `${ENV.apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export default ENV;

