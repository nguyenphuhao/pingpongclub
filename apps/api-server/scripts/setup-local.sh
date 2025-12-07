#!/bin/bash

# Setup Local Development Infrastructure
# Run: chmod +x scripts/setup-local.sh && ./scripts/setup-local.sh

set -e

echo "🚀 Setting up Dokifree local development environment..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Start Docker Compose
echo ""
echo "📦 Starting Docker containers..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check PostgreSQL health
until docker exec dokifree-postgres pg_isready -U dokifree > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL..."
    sleep 2
done

echo -e "${GREEN}✅ PostgreSQL is ready${NC}"

# Check Redis health
echo ""
echo "⏳ Checking Redis..."
if docker exec dokifree-redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is ready${NC}"
else
    echo -e "${YELLOW}⚠️  Redis check failed (optional service)${NC}"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    yarn install
fi

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
yarn prisma:generate

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
yarn prisma:migrate dev --name init || echo -e "${YELLOW}⚠️  Migrations may already exist${NC}"

# Seed database
echo ""
echo "🌱 Seeding database..."
yarn prisma:seed

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📊 Services running:"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo "   - pgAdmin: http://localhost:5050 (admin@dokifree.local / admin)"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: You need to setup Firebase Admin SDK credentials${NC}"
echo ""
echo "📝 Next steps:"
echo "   1. Get Firebase Service Account key:"
echo "      https://console.firebase.google.com/project/dokifree-30eee/settings/serviceaccounts/adminsdk"
echo ""
echo "   2. Click 'Generate new private key' and download JSON"
echo ""
echo "   3. Copy credentials to .env file:"
echo "      - FIREBASE_PRIVATE_KEY"
echo "      - FIREBASE_CLIENT_EMAIL"
echo ""
echo "   4. Start development server:"
echo "      yarn dev"
echo ""
echo "🔧 Useful commands:"
echo "   yarn docker:logs    - View logs"
echo "   yarn docker:down    - Stop containers"
echo "   yarn docker:reset   - Reset all data"
echo "   yarn prisma:studio  - Open database GUI"
echo ""

