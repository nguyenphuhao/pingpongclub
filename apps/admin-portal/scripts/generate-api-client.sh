#!/bin/bash

# Get API URL from env or use default
API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3000}
SWAGGER_URL="${API_URL}/api/docs"

echo "🔄 Generating API client from Swagger spec..."
echo "📡 Fetching from: ${SWAGGER_URL}"

# Check if BE server is running
if ! curl -s "${SWAGGER_URL}" > /dev/null 2>&1; then
  echo "⚠️  Warning: Cannot reach ${SWAGGER_URL}"
  echo "💡 Make sure BE server is running on ${API_URL}"
  echo "💡 You can start it with: cd ../dokifree-be && yarn dev"
  exit 1
fi

# Generate API client
swagger-typescript-api generate \
  -p "${SWAGGER_URL}" \
  -o ./src/lib/generated \
  -n api-client.ts \
  --http-client-type fetch \
  --modular=false \
  --clean-output=true \
  --extract-request-params=true \
  --extract-request-body=true \
  --extract-enums=true \
  --unwrap-response-data=true \
  --generate-union-enums=true

if [ $? -eq 0 ]; then
  echo "✅ API client generated successfully!"
  echo "📁 Output: src/lib/generated/api-client.ts"
else
  echo "❌ Failed to generate API client"
  exit 1
fi

