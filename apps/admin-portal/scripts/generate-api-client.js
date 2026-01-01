#!/usr/bin/env node

/**
 * Generate API Client from Swagger Spec
 * Alternative Node.js script (works cross-platform)
 */

const { execSync } = require('child_process');
const http = require('http');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const SWAGGER_URL = `${API_URL}/api/docs`;

console.log('🔄 Generating API client from Swagger spec...');
console.log(`📡 Fetching from: ${SWAGGER_URL}`);

// Check if BE server is running
function checkServer(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const req = http.request(
      {
        hostname: urlObj.hostname,
        port: urlObj.port || 3000,
        path: urlObj.pathname,
        method: 'HEAD',
        timeout: 3000,
      },
      (res) => {
        resolve(res.statusCode === 200);
      }
    );

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  const isServerRunning = await checkServer(SWAGGER_URL);

  if (!isServerRunning) {
    console.log('⚠️  Warning: Cannot reach BE server');
    console.log(`💡 Make sure BE server is running on ${API_URL}`);
    console.log('💡 You can start it with: cd ../pingclub-be && yarn dev');
    console.log('');
    console.log('❌ Aborting API client generation');
    process.exit(1);
  }

  try {
    console.log('✅ BE server is running, generating API client...\n');

    execSync(
      `swagger-typescript-api generate -p "${SWAGGER_URL}" -o ./src/lib/generated -n api-client.ts --http-client-type fetch --modular=false --clean-output=true --extract-request-params=true --extract-request-body=true --extract-enums=true --unwrap-response-data=true --generate-union-enums=true`,
      {
        stdio: 'inherit',
        cwd: process.cwd(),
      }
    );

    console.log('\n✅ API client generated successfully!');
    console.log('📁 Output: src/lib/generated/api-client.ts');
    console.log('\n💡 Next steps:');
    console.log('   1. Review generated code in src/lib/generated/');
    console.log('   2. Update src/lib/api-client-generated.ts to use generated client');
    console.log('   3. Gradually migrate from manual api-client.ts to generated client');
  } catch (error) {
    console.error('\n❌ Failed to generate API client');
    console.error(error.message);
    process.exit(1);
  }
}

main();

