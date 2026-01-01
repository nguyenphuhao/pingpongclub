import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile local packages from source in development
  transpilePackages: ['@pingclub/database', '@pingclub/auth'],
  webpack: (config, { isServer }) => {
    // Resolve local packages from source in development
    if (process.env.NODE_ENV === 'development') {
      const rootPath = path.resolve(__dirname, '../..');
      config.resolve.alias = {
        ...config.resolve.alias,
        '@pingclub/database': path.resolve(rootPath, 'packages/database/src/index.ts'),
        '@pingclub/auth': path.resolve(rootPath, 'packages/auth/src/index.ts'),
        '@pingclub/auth/admin': path.resolve(rootPath, 'packages/auth/src/admin/index.ts'),
        '@pingclub/auth/user': path.resolve(rootPath, 'packages/auth/src/user/index.ts'),
        '@pingclub/auth/utils': path.resolve(rootPath, 'packages/auth/src/utils/index.ts'),
      };
    }
    return config;
  },
};

export default nextConfig;

