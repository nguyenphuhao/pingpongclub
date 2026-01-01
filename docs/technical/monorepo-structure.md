# Monorepo Structure & Organization

## 📂 Directory Structure

```
pingclub/
├── apps/                        # Applications
│   ├── admin-portal/           # Admin Dashboard (Next.js)
│   ├── mobile-app/             # Mobile App (React Native)
│   └── api-server/             # Backend API (Next.js)
│
├── packages/                    # Shared packages
│   ├── database/               # @pingclub/database
│   ├── auth/                   # @pingclub/auth
│   ├── web-ui/                 # @pingclub/web-ui
│   └── mobile-ui/              # @pingclub/mobile-ui
│
├── docs/                       # Documentation
├── package.json                # Root package.json
├── turbo.json                  # Turborepo configuration
├── tsconfig.json               # Base TypeScript config
└── yarn.lock                   # Lock file
```

---

## 🎯 Package Overview

### Apps

| App | Name | Port | Description |
|-----|------|------|-------------|
| `admin-portal` | Admin Dashboard | 8080 | User management interface |
| `mobile-app` | Mobile App | - | React Native/Expo app |
| `api-server` | Backend API | 3000 | REST API server |

### Packages

| Package | Name | Description |
|---------|------|-------------|
| `database` | `@pingclub/database` | Prisma client & types |
| `auth` | `@pingclub/auth` | Auth utilities |
| `web-ui` | `@pingclub/web-ui` | Web design tokens |
| `mobile-ui` | `@pingclub/mobile-ui` | Mobile design tokens |

---

## 📦 Package Details

### @pingclub/database

**Purpose:** Centralized database access and type definitions

**Structure:**
```
packages/database/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed data
│   └── migrations/            # Migration files
├── src/
│   ├── index.ts               # Export Prisma client
│   └── types.ts               # Additional types
├── package.json
└── tsconfig.json
```

**Exports:**
```typescript
export { prisma } from '@pingclub/database';
export * from '@prisma/client';  // All Prisma types
```

**Usage:**
```typescript
import { prisma, User, UserRole } from '@pingclub/database';
```

---

### @pingclub/auth

**Purpose:** Shared authentication utilities

**Structure:**
```
packages/auth/
├── src/
│   ├── admin/                 # Admin authentication
│   │   ├── verify.ts         # Credential verification
│   │   └── index.ts
│   ├── user/                  # User authentication (future)
│   │   └── index.ts
│   ├── utils/                 # Utilities
│   │   └── password.ts       # Password hashing
│   └── index.ts               # Main export
├── package.json
└── tsconfig.json
```

**Exports:**
```typescript
// Admin auth
export { verifyAdminCredentials, getAdminUser, isAdmin };

// Password utilities
export { hashPassword, verifyPassword, isValidHash };
```

**Dependencies:**
- `@pingclub/database` - Database access
- `bcryptjs` - Password hashing

---

### @pingclub/web-ui

**Purpose:** Web design system and tokens

**Structure:**
```
packages/web-ui/
├── src/
│   ├── tokens/
│   │   ├── colors.ts          # Color palette
│   │   └── index.ts           # Design tokens
│   ├── components/            # UI components (future)
│   └── index.ts
├── tailwind.config.js         # Tailwind configuration
├── package.json
└── tsconfig.json
```

**Exports:**
```typescript
export { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS };
export { ColorUtils, StatusColors };
```

**Dependencies:** None (only design tokens)

---

### @pingclub/mobile-ui

**Purpose:** Mobile design system and tokens

**Structure:**
```
packages/mobile-ui/
├── src/
│   ├── tokens/
│   │   ├── colors.ts          # Color palette
│   │   └── index.ts           # Design tokens
│   ├── components/            # UI components (future)
│   └── index.ts
├── tailwind.config.js         # NativeWind configuration
├── package.json
└── tsconfig.json
```

**Exports:**
```typescript
export { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS };
export { ColorUtils, StatusColors };
```

**Dependencies:** None (only design tokens)

---

## 🏗️ App Structures

### admin-portal

```
apps/admin-portal/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── login/
│   │   ├── dashboard/
│   │   └── users/
│   ├── components/
│   │   ├── admin/             # Admin-specific components
│   │   └── ui/                # shadcn/ui components
│   └── lib/
│       ├── api-client-v2.ts   # API client
│       ├── auth.ts            # (deprecated - use @pingclub/auth)
│       └── prisma.ts          # (deprecated - use @pingclub/database)
├── public/
├── package.json
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

**Key Dependencies:**
- `@pingclub/database`
- `@pingclub/auth`
- `@pingclub/web-ui`
- `next`, `react`, `react-dom`
- Radix UI components
- `react-hook-form`, `zod`

---

### mobile-app

```
apps/mobile-app/
├── app/                       # Expo Router
│   ├── _layout.tsx
│   ├── index.tsx
│   └── design-system.tsx
├── components/
│   ├── ui/                    # RN Primitives components
│   ├── AnimatedSplash.tsx
│   └── ColorPalette.tsx
├── lib/
│   ├── config.ts
│   ├── design-tokens.ts       # (deprecated - use @pingclub/mobile-ui)
│   └── colors.ts              # (deprecated - use @pingclub/mobile-ui)
├── assets/
├── android/
├── ios/
├── package.json
├── app.config.js
├── tailwind.config.js
└── tsconfig.json
```

**Key Dependencies:**
- `@pingclub/mobile-ui`
- `expo`, `react`, `react-native`
- RN Primitives components
- `nativewind`, `tailwindcss`

---

### api-server

```
apps/api-server/
├── src/
│   ├── app/                   # Next.js App Router
│   │   └── api/               # API routes
│   │       ├── auth/
│   │       ├── admin/
│   │       ├── users/
│   │       └── docs/
│   ├── server/
│   │   ├── common/
│   │   │   ├── adapters/      # External service adapters
│   │   │   ├── config/
│   │   │   ├── database/      # (deprecated - use @pingclub/database)
│   │   │   ├── exceptions/
│   │   │   ├── swagger/
│   │   │   └── utils/
│   │   └── modules/
│   │       ├── auth/          # Authentication module
│   │       ├── users/         # User management module
│   │       ├── admin/         # Admin module
│   │       └── notifications/ # Notification module
│   └── shared/
│       ├── dtos/              # Data transfer objects
│       └── types/             # Shared types
├── prisma/                    # (deprecated - moved to @pingclub/database)
├── package.json
├── next.config.js
└── tsconfig.json
```

**Key Dependencies:**
- `@pingclub/database`
- `@pingclub/auth`
- `next`, `react`, `react-dom`
- `firebase-admin`
- `jsonwebtoken`
- `@sendgrid/mail`, `twilio`
- `swagger-jsdoc`, `swagger-ui-react`

---

## 🔄 Dependency Graph

```
┌──────────────┐
│ admin-portal │
└──────┬───────┘
       │
       ├─→ @pingclub/database
       ├─→ @pingclub/auth
       └─→ @pingclub/web-ui

┌──────────────┐
│  mobile-app  │
└──────┬───────┘
       │
       └─→ @pingclub/mobile-ui

┌──────────────┐
│  api-server  │
└──────┬───────┘
       │
       ├─→ @pingclub/database
       └─→ @pingclub/auth

┌──────────────┐
│ @pingclub/   │
│    auth      │
└──────┬───────┘
       │
       └─→ @pingclub/database

┌──────────────┐
│ @pingclub/   │
│   database   │
└──────┬───────┘
       │
       └─→ @prisma/client
```

---

## 🛠️ Workspace Configuration

### Root package.json

```json
{
  "name": "pingclub-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "db:generate": "yarn workspace @pingclub/database prisma:generate"
  }
}
```

### Turborepo Configuration

**turbo.json:**
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Benefits:**
- Incremental builds
- Remote caching
- Parallel execution
- Task dependencies

---

## 📝 Development Workflow

### Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd pingclub

# Install dependencies
yarn install

# Generate Prisma client
yarn db:generate

# Start development
yarn dev:admin      # or yarn dev:mobile, yarn dev:api
```

### Adding a New Package

```bash
# Create package directory
mkdir -p packages/new-package/src

# Create package.json
cat > packages/new-package/package.json << EOF
{
  "name": "@pingclub/new-package",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
EOF

# Create source files
# ...

# Install dependencies
yarn install
```

### Adding Package to App

```json
// In app's package.json
{
  "dependencies": {
    "@pingclub/new-package": "*"
  }
}
```

```bash
# Reinstall
yarn install
```

---

## 🔧 Build Process

### Package Build Order

1. **@pingclub/database** (no dependencies)
2. **@pingclub/auth** (depends on database)
3. **@pingclub/web-ui** (no dependencies)
4. **@pingclub/mobile-ui** (no dependencies)
5. **Apps** (depend on packages)

### Build Commands

```bash
# Build all packages
yarn turbo run build --filter='@pingclub/*'

# Build specific app
yarn turbo run build --filter=admin-portal

# Build with dependencies
yarn turbo run build --filter=api-server...
```

---

## 📦 Import/Export Patterns

### Package Imports

```typescript
// From packages
import { prisma, User } from '@pingclub/database';
import { hashPassword } from '@pingclub/auth';
import { COLORS } from '@pingclub/web-ui/tokens';
import { COLORS } from '@pingclub/mobile-ui/tokens';

// From local files
import { Component } from '@/components/Component';
import { helper } from '@/lib/helper';
```

### Package Exports

```typescript
// packages/database/src/index.ts
export { prisma } from './client';
export * from '@prisma/client';

// packages/auth/src/index.ts
export * from './admin';
export * from './utils';

// packages/web-ui/src/index.ts
export * from './tokens';
```

---

## 🎨 Code Organization Principles

### 1. Single Responsibility
- Each package has one clear purpose
- Packages are focused and cohesive

### 2. Dependency Direction
- Dependencies flow from apps to packages
- Packages can depend on other packages
- No circular dependencies

### 3. Type Safety
- TypeScript throughout
- Shared types from @pingclub/database
- Strict mode enabled

### 4. Code Reuse
- Common logic in packages
- App-specific code in apps
- No duplication

---

## 🚀 Deployment Strategy

### Package Publishing

Packages are **not published** to npm:
- Internal use only
- Workspace protocol (`"*"`)
- Symlinked during development

### App Deployment

**admin-portal:**
- Build: `yarn turbo run build --filter=admin-portal`
- Deploy: Vercel / Netlify
- Static export or SSR

**mobile-app:**
- Build: `eas build`
- Deploy: Expo EAS
- iOS App Store / Google Play

**api-server:**
- Build: `yarn turbo run build --filter=api-server`
- Deploy: Vercel / Railway / Fly.io
- Environment variables required

---

## ✅ Best Practices

### Do's
✅ Use workspace packages for shared code
✅ Keep packages focused and minimal
✅ Build packages before apps
✅ Use TypeScript strictly
✅ Document package APIs
✅ Version lock critical dependencies

### Don'ts
❌ Create circular dependencies
❌ Duplicate code across packages
❌ Mix app and package code
❌ Publish internal packages
❌ Skip type checking
❌ Ignore build errors

---

**Last Updated**: December 2025

