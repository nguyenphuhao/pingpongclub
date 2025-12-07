# API Server

Backend API server for Dokifree platform built with Next.js, designed for easy migration to NestJS.

> **Part of Dokifree Monorepo** - See [Monorepo Documentation](../../docs/README.md) for overall architecture.

## 🏗️ Architecture

This project follows **Clean Architecture + Domain-Driven Design** principles:

- ✅ Business logic completely separated from Next.js framework
- ✅ Easy to migrate individual modules to NestJS
- ✅ Maximum code reuse between Next.js and NestJS
- ✅ Shared types/DTOs for Frontend and Backend

### Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # HTTP handlers (parse req/res only)
│   └── ...                   # UI pages
│
├── server/                   # Backend logic (framework-agnostic)
│   ├── modules/              # Domain modules
│   │   ├── auth/
│   │   │   ├── application/  # Services, Use Cases
│   │   │   ├── domain/       # Entities, Business Rules
│   │   │   └── infrastructure/ # Repositories, External APIs
│   │   ├── users/
│   │   ├── admin/
│   │   └── notifications/
│   │
│   └── common/               # Shared server utilities
│       ├── adapters/         # Firebase, Email, SMS, Push
│       ├── config/           # Configuration
│       └── exceptions/       # Custom errors
│
└── shared/                   # Shared FE + BE code
    ├── dtos/                 # Data Transfer Objects
    └── types/                # TypeScript types
```

### NestJS Migration Path

Each module in `src/server/modules/` is designed to map 1:1 with NestJS:

| Next.js (Current) | NestJS (Future) |
|-------------------|-----------------|
| `modules/auth/application/auth.service.ts` | `@Injectable() AuthService` |
| `modules/auth/infrastructure/auth.repository.ts` | `@Injectable() AuthRepository` |
| `app/api/auth/login/route.ts` | `@Controller('auth')` → `@Post('login')` |
| `shared/dtos/auth/` | Shared unchanged |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Yarn package manager

### Installation

```bash
# From monorepo root
cd /Users/hipages/Projects/dokifree
yarn install
```

### Environment Setup

```bash
# Create .env file
cat > apps/api-server/.env << EOF
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/dokifree"

# JWT
JWT_SECRET="your-jwt-secret-key-here"
JWT_EXPIRES_IN="7d"

# Firebase (see Firebase Setup section)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"

# Email (SendGrid)
SENDGRID_API_KEY="SG.xxxxx"
SENDGRID_FROM_EMAIL="noreply@dokifree.com"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="ACxxxxx"
TWILIO_AUTH_TOKEN="xxxxx"
TWILIO_PHONE_NUMBER="+1234567890"

# App Config
NODE_ENV="development"
PORT="3000"
EOF
```

### Database Setup

```bash
# From monorepo root

# Generate Prisma client
yarn db:generate

# Run migrations
yarn db:migrate

# Seed database (optional)
yarn db:seed

# Open Prisma Studio (optional)
yarn db:studio
```

### Run Development Server

```bash
# From monorepo root
yarn dev:api

# Or from this directory
yarn dev
```

Server will be available at `http://localhost:3000`

### Test API Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# List users (after seeding)
curl http://localhost:3000/api/users

# View API documentation
open http://localhost:3000/api-docs
```

## 🔥 Firebase Setup

### Get Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click ⚙️ **Project Settings** → **Service Accounts**
4. Click **"Generate new private key"**
5. Save the downloaded JSON file securely

### Extract Credentials

The downloaded JSON file contains:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  ...
}
```

### Add to .env

Update your `.env` file:

```bash
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
```

**⚠️ IMPORTANT:**
- Keep `\n` in `FIREBASE_PRIVATE_KEY`
- Wrap entire string in quotes
- Don't remove `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- **NEVER** commit this to Git

### Verify Setup

```bash
# Start server
yarn dev

# Should see in console:
# ✅ Firebase Admin initialized

# Test Firebase auth endpoint
curl -X POST http://localhost:3000/api/auth/firebase \
  -H "Content-Type: application/json" \
  -d '{"idToken": "test-token"}'

# Expected: {"success": false, "error": {"message": "Invalid Firebase token"}}
# (Error is expected with fake token, but confirms Firebase is initialized)
```

### Frontend Integration

```javascript
// Frontend Firebase config
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  ...
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Login flow
import { signInWithEmailAndPassword } from "firebase/auth";

const { user } = await signInWithEmailAndPassword(auth, email, password);
const idToken = await user.getIdToken();

// Send to backend
const response = await fetch('/api/auth/firebase', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken })
});

const { user, accessToken, refreshToken } = await response.json();
```

### Security Notes

- ✅ Store Service Account JSON securely
- ✅ Add to `.gitignore`: `firebase-service-account.json`, `firebase-adminsdk-*.json`
- ❌ **NEVER** commit private key to Git
- ❌ **NEVER** expose in client-side code
- ❌ **NEVER** share Service Account credentials

## 📘 API Documentation

### Swagger/OpenAPI

Interactive API documentation available at:

- **Swagger UI:** http://localhost:3000/api-docs
- **OpenAPI JSON:** http://localhost:3000/api/docs

All endpoints documented with:
- Request/response schemas
- Authentication requirements
- Example payloads
- Error responses

### Available Endpoints

**Authentication:**
- `POST /api/auth/firebase` - Firebase authentication
- `POST /api/auth/register/otp` - Request OTP for registration
- `POST /api/auth/register/verify` - Verify OTP and register
- `POST /api/auth/login/otp` - Request OTP for login
- `POST /api/auth/login/verify` - Verify OTP and login
- `POST /api/auth/login/password` - Login with password
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/login-history` - Get login history
- `GET /api/auth/sessions` - Get active sessions

**Users:**
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user details
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

**Admin:**
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/users` - Admin user management
- `GET /api/admin/dashboard/stats` - Dashboard statistics

See [API Documentation](../../docs/api/authentication-api.md) for complete details.

## 📦 Available Scripts

```bash
# Development
yarn dev              # Start dev server
yarn build            # Build for production
yarn start            # Start production server

# Code Quality
yarn lint             # Run ESLint
yarn type-check       # Type check

# Database (use monorepo root)
yarn db:generate      # Generate Prisma client
yarn db:migrate       # Run migrations
yarn db:studio        # Open Prisma Studio
yarn db:seed          # Seed database
```

## 🔧 Development Workflow

### Adding New Module

```bash
# Create module structure
mkdir -p src/server/modules/orders/{domain,application,infrastructure}

# Create files
touch src/server/modules/orders/domain/order.entity.ts
touch src/server/modules/orders/infrastructure/order.repository.ts
touch src/server/modules/orders/application/order.service.ts

# Create API routes
mkdir -p src/app/api/orders
touch src/app/api/orders/route.ts
```

### Adding New Prisma Model

```prisma
// In @dokifree/database package
model Order {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  total     Decimal
  status    OrderStatus
  createdAt DateTime @default(now()) @map("created_at")
  
  user User @relation(fields: [userId], references: [id])
  
  @@map("orders")
}
```

```bash
# Run migration
yarn db:migrate
```

### Creating DTOs

```typescript
// src/shared/dtos/order.dto.ts
import { z } from 'zod';

export const CreateOrderDtoSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
  })),
});

export type CreateOrderDto = z.infer<typeof CreateOrderDtoSchema>;
```

## 📝 Development Principles

1. **Never** import `next/*` in `src/server/modules/`
2. **Always** separate business logic into services
3. **API routes** only parse requests and call services
4. **Shared DTOs** for all API contracts
5. **Repository pattern** for database access
6. **Document with Swagger** - Add `@swagger` JSDoc for all endpoints

## 🔄 NestJS Migration Process (Future)

1. Create new NestJS project
2. Copy modules from `src/server/modules/` to NestJS
3. Wrap services with `@Injectable()`
4. Create `@Controller()` from API routes
5. Update Frontend API calls (change URL if needed)
6. Migrate module by module, test, deploy

## 🧪 Testing

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Test coverage
yarn test:cov
```

### Test Accounts (Development)

**Regular User:**
```
Email: test@dokifree.com
Password: Test123456
```

**Admin:**
```
Username: admin
Password: admin123
```

## 🐛 Troubleshooting

### Prisma Client not generated
```bash
yarn db:generate
```

### Firebase "Invalid credentials"
- Check `FIREBASE_PRIVATE_KEY` has `\n` in the string
- Verify key from JSON file
- Ensure quotes wrap the entire key

### TypeScript path errors
```bash
# Restart TypeScript server in VSCode
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Port 3000 already in use
```bash
PORT=3001 yarn dev
```

### Database connection failed
- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

## 📚 Documentation

- [Architecture Overview](../../docs/architecture/overview.md)
- [Tech Stack](../../docs/architecture/tech-stack.md)
- [Database Schema](../../docs/technical/database-schema.md)
- [Authentication](../../docs/features/authentication.md)
- [API Endpoints](../../docs/api/authentication-api.md)
- [Monorepo Structure](../../docs/technical/monorepo-structure.md)

## 🔗 Related Packages

- `@dokifree/database` - Shared Prisma client and models
- `@dokifree/auth` - Authentication utilities

---

**Port:** 3000  
**Swagger UI:** http://localhost:3000/api-docs  
**Database:** Shared with admin-portal
