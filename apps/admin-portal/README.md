# Admin Portal

Admin web application for managing Dokifree platform.

> **Part of Dokifree Monorepo** - See [Monorepo Documentation](../../docs/README.md) for overall architecture.

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **UI:** shadcn/ui + Tailwind CSS
- **Design System:** @dokifree/web-ui
- **Authentication:** Admin session management
- **Package Manager:** Yarn Workspaces

## 📁 Project Structure

```
apps/admin-portal/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── login/            # Admin login
│   │   ├── dashboard/        # Dashboard with stats
│   │   └── users/            # User management
│   ├── components/
│   │   ├── admin/            # Admin-specific components
│   │   └── ui/               # shadcn/ui components
│   └── lib/
│       ├── api-client-v2.ts  # API client
│       └── utils.ts          # Utilities
├── components.json            # shadcn/ui config
├── tailwind.config.ts        # Tailwind config
└── package.json
```

## ⚙️ Setup

### 1. Install Dependencies (Monorepo Root)

```bash
# From monorepo root
cd /Users/hipages/Projects/dokifree
yarn install
```

### 2. Setup Environment Variables

```bash
# Create .env.local
cat > apps/admin-portal/.env.local << EOF
# Database (same as api-server)
DATABASE_URL="postgresql://user:password@localhost:5432/dokifree"

# API Server
NEXT_PUBLIC_API_URL="http://localhost:3000"

# Admin Portal
NEXTAUTH_URL="http://localhost:8080"
NEXTAUTH_SECRET="your-secret-key-here"
EOF
```

### 3. Generate Prisma Client

```bash
# From monorepo root
yarn db:generate
```

### 4. Run Development Server

```bash
# From monorepo root
yarn dev:admin

# Or from this directory
yarn dev
```

The app will be available at `http://localhost:8080`

## 🎨 Design System

Uses shared design tokens from `@dokifree/web-ui`:

- **Primary Color:** Purple (#7C5CDB)
- **Secondary Color:** Orange (#FF8F2E)
- **Typography:** SF Pro Display
- **Spacing:** 8px base unit grid system

```typescript
import { COLORS } from '@dokifree/web-ui/tokens';
```

## 📦 Available Scripts

```bash
# Development
yarn dev              # Start dev server (port 8080)
yarn build            # Build for production
yarn start            # Start production server

# Code Quality
yarn lint             # Run ESLint
yarn type-check       # Type check without emitting

# Database (use monorepo root commands)
yarn db:generate      # Generate Prisma client
yarn db:migrate       # Run migrations
yarn db:studio        # Open Prisma Studio
```

## 🔐 Authentication

Admin authentication uses:
- **Admin users** from `admin` table (separate from regular users)
- **Session-based auth** with NextAuth.js
- **Role-based access:** ADMIN, MODERATOR

```typescript
// Check admin credentials
import { verifyAdminCredentials } from '@dokifree/auth/admin';

const admin = await verifyAdminCredentials(username, password);
```

## 🔄 API Client

### Auto-Generated API Client

API client is auto-generated from Backend's Swagger/OpenAPI spec.

#### Generate API Client

```bash
# Make sure api-server is running
yarn dev:api  # From monorepo root

# Generate client (from this directory)
yarn generate:api
```

#### Generated Files

Files are created in `src/lib/generated/`:
- `api-client.ts` - Generated API client with type-safe methods
- `api-client.types.ts` - TypeScript types
- `api-client.contracts.ts` - API contracts

#### Usage

```typescript
import { Api } from '@/lib/generated/api-client';

const api = new Api({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  customFetch: async (url, options) => {
    const token = getAdminToken();
    return fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
  },
});

// Use generated methods with full type safety
const users = await api.users.usersControllerListUsers({
  page: 1,
  limit: 10,
});
```

#### Regenerate When API Changes

```bash
# 1. Update Swagger docs in api-server
# 2. Restart api-server
# 3. Regenerate client
yarn generate:api
```

#### Configuration

Edit `swagger-api.config.json` for generation options:
- `url`: Swagger spec URL
- `output`: Output directory
- `httpClientType`: fetch or axios
- `unwrapResponseData`: Auto unwrap response.data

## 🌐 Features

### Dashboard
- Total users count
- New users (24h)
- Active users (last hour)
- Recent user activity

### User Management
- List all users with pagination
- Search by email, name
- Filter by role, status
- View user details
- Edit user information
- Change user status
- View login history
- Manage user sessions

### Session Management
- View active sessions per user
- Force logout specific device
- Force logout all devices
- Session details (IP, device, platform)

## 🚧 Development Workflow

### Adding New Pages

```bash
# Create new page in app directory
mkdir -p src/app/new-page
touch src/app/new-page/page.tsx
```

### Adding UI Components

```bash
# Add shadcn/ui components
npx shadcn-ui@latest add [component-name]

# Example:
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

### Using Shared Packages

```typescript
// Database access
import { prisma, User, UserRole } from '@dokifree/database';

// Auth utilities
import { verifyAdminCredentials } from '@dokifree/auth/admin';

// Design tokens
import { COLORS } from '@dokifree/web-ui/tokens';
```

## 🐛 Troubleshooting

### Cannot generate API client
```bash
# Ensure api-server is running
cd ../../
yarn dev:api

# Check Swagger endpoint
curl http://localhost:3000/api/docs
```

### Type errors after API generation
```bash
# Regenerate Prisma client
yarn db:generate

# Clear .next cache
rm -rf .next
yarn dev
```

### Port 8080 already in use
```bash
# Use different port
PORT=8081 yarn dev
```

## 📚 Documentation

- [Monorepo Structure](../../docs/technical/monorepo-structure.md)
- [Architecture Overview](../../docs/architecture/overview.md)
- [Authentication](../../docs/features/authentication.md)
- [API Documentation](../../docs/api/authentication-api.md)

## 🔗 Related Packages

- `@dokifree/database` - Shared Prisma client
- `@dokifree/auth` - Authentication utilities
- `@dokifree/web-ui` - Web design system

---

**Port:** 8080  
**API Server:** http://localhost:3000  
**Database:** Shared with api-server
