// app.config.js
// Multi-environment configuration for Dokifree App
// Supports: staging and production environments

const IS_STAGING = process.env.APP_ENV === 'staging';

const getAppConfig = () => {
  const baseConfig = {
    expo: {
      // App name changes based on environment
      name: IS_STAGING ? 'DOKIFREE (Staging)' : 'DOKIFREE',
      slug: 'dokifree-app',
      version: '1.0.0',
      orientation: 'portrait',
      
      // Different icons for staging/prod to easily distinguish
      icon: IS_STAGING 
        ? './assets/images/icon-staging.png' 
        : './assets/images/icon.png',
      
      // Different URL schemes
      scheme: IS_STAGING ? 'dokifree-staging' : 'dokifree-app',
      userInterfaceStyle: 'automatic',
      newArchEnabled: true,
      
      splash: {
        image: './assets/images/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#E8E4F5',
      },
      
      assetBundlePatterns: ['**/*'],
      
      // iOS configuration
      ios: {
        supportsTablet: true,
        // Different bundle identifiers allow both apps to be installed simultaneously
        bundleIdentifier: IS_STAGING
          ? 'com.dokifreeapp.staging'
          : 'com.dokifreeapp.prod',
      },
      
      // Android configuration
      android: {
        edgeToEdgeEnabled: true,
        // Different package names allow both apps to be installed simultaneously
        package: IS_STAGING
          ? 'com.dokifreeapp.staging'
          : 'com.dokifreeapp.prod',
        adaptiveIcon: {
          foregroundImage: IS_STAGING
            ? './assets/images/adaptive-icon-staging.png'
            : './assets/images/adaptive-icon.png',
          // Yellow background for staging to distinguish from production
          backgroundColor: IS_STAGING ? '#FFD33F' : '#ffffff',
        },
      },
      
      web: {
        bundler: 'metro',
        output: 'static',
        favicon: './assets/images/favicon.png',
      },
      
      plugins: ['expo-router', 'expo-dev-client'],
      
      experiments: {
        typedRoutes: true,
      },
      
      // Extra configuration accessible in the app via expo-constants
      extra: {
        environment: IS_STAGING ? 'staging' : 'production',
        // API URLs for different environments
        apiUrl: IS_STAGING 
          ? 'https://api-staging.dokifree.com'
          : 'https://api.dokifree.com',
        // Feature flags
        enableDebugMode: IS_STAGING,
        enableAnalytics: !IS_STAGING, // Only in production
        // You can add more environment-specific configs here
      },
    },
  };

  // Log current environment
  console.log('🚀 Building for environment:', IS_STAGING ? 'STAGING' : 'PRODUCTION');

  return baseConfig;
};

module.exports = getAppConfig();

