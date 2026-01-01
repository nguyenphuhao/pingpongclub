# Architecture Overview

## System Architecture

Pingclub is built as a **monorepo** containing multiple applications and shared packages, following modern software architecture principles.

```
┌─────────────────────────────────────────────────────────────┐
│                    Pingclub Platform                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Admin Portal │  │  Mobile App  │  │  API Server  │      │
│  │  (Next.js)   │  │ (React Native│  │  (Next.js)   │      │
│  │    :8080     │  │    /Expo)    │  │    :3000     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘              │
│                            │                                  │
│         ┌──────────────────▼──────────────────┐             │
│         │      Shared Packages (@pingclub/*)   │             │
│         ├───────────────────────────────────────┤             │
│         │  database  │  auth  │ web-ui │mobile-ui│          │
│         └──────────────────┬──────────────────┘             │
│                            │                                  │
│         ┌──────────────────▼──────────────────┐             │
│         │        PostgreSQL Database           │             │
│         │         (Prisma ORM)                │             │
│         └─────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## 🏗️ Architecture Layers

### 1. Presentation Layer

**Admin Portal** (Web)
- Next.js 14 with App Router
- Server-side rendering
- Radix UI components
- Tailwind CSS styling
- Port: 8080

**Mobile App**
- React Native / Expo
- Cross-platform (iOS, Android)
- NativeWind styling
- RN Primitives components

### 2. API Layer

**API Server**
- Next.js API Routes (current)
- RESTful endpoints
- JWT authentication
- Rate limiting
- Swagger documentation
- Port: 3000

**Future: NestJS Migration**
- Modular architecture
- Dependency injection
- TypeScript decorators
- Better scalability

### 3. Business Logic Layer

**Modules** (Domain-Driven Design)
```
src/server/modules/
├── auth/           # Authentication & authorization
├── users/          # User management
├── admin/          # Admin management
└── notifications/  # Notification system
```

Each module contains:
- `domain/` - Entities and business rules
- `application/` - Use cases and services
- `infrastructure/` - Repositories and adapters

### 4. Data Layer

**Database**
- PostgreSQL (primary datastore)
- Prisma ORM
- Type-safe queries
- Migrations management

**Models:**
- Users & Authentication
- Admin Users
- Sessions & Tokens
- Login History
- Notifications
- Devices

### 5. Shared Layer

**Workspace Packages**

```typescript
@pingclub/database    // Prisma client & types
@pingclub/auth        // Auth utilities
@pingclub/web-ui      // Web design tokens
@pingclub/mobile-ui   // Mobile design tokens
```

---

## 🔄 Data Flow

### User Authentication Flow

```
[User] → [Client App]
           ↓
    [HTTP Request]
           ↓
    [API Server] → [Auth Middleware]
           ↓
    [Auth Service] → [Database]
           ↓              ↓
    [JWT Token] ← [User Data]
           ↓
    [Response to Client]
```

### Admin Portal Flow

```
[Admin User] → [Next.js SSR]
                    ↓
              [Server Actions]
                    ↓
              [API Client] → [API Server]
                                  ↓
                             [Database]
                                  ↓
              [Response] ← [Data]
                    ↓
              [Render UI]
```

---

## 🎯 Design Principles

### 1. Monorepo Organization

**Benefits:**
- Code sharing across apps
- Consistent dependencies
- Atomic cross-project changes
- Better developer experience

**Tools:**
- Yarn Workspaces
- Turborepo
- TypeScript Project References

### 2. Domain-Driven Design

**Modules Structure:**
```
module/
├── domain/          # Business entities
├── application/     # Use cases
└── infrastructure/  # External interfaces
```

**Benefits:**
- Clear separation of concerns
- Business logic isolation
- Easier testing
- Better maintainability

### 3. Clean Architecture

**Dependency Rule:**
```
Infrastructure → Application → Domain
     ↓              ↓            ↓
  Database      Services    Entities
   Adapters     Use Cases   Business Rules
```

**No dependencies flow inward:**
- Domain doesn't know about infrastructure
- Application doesn't know about frameworks
- Easy to swap implementations

### 4. Type Safety

**TypeScript Everywhere:**
- Shared types from database
- API type generation
- Component prop types
- End-to-end type safety

---

## 🔐 Security Architecture

### Authentication Flow

```
Client → JWT Token → API Middleware → Verify → Route Handler
                          ↓
                    Database Check
                          ↓
                   Permission Check
```

### Authorization Layers

1. **Network Level**
   - CORS configuration
   - Rate limiting
   - IP filtering (future)

2. **Application Level**
   - JWT verification
   - Role-based access control
   - Session validation

3. **Data Level**
   - Row-level security (future)
   - Encrypted sensitive data
   - Audit logging

---

## 📊 Database Design

### Schema Organization

```
┌─────────────────────────────────────┐
│          User Management            │
├─────────────────────────────────────┤
│ • users                             │
│ • admin (separate table)            │
│ • devices                           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      Authentication & Sessions      │
├─────────────────────────────────────┤
│ • refresh_tokens                    │
│ • otp_verifications                 │
│ • login_history                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│          Notifications              │
├─────────────────────────────────────┤
│ • notifications                     │
└─────────────────────────────────────┘
```

### Key Relationships

```
User ←─┬─→ RefreshToken
       ├─→ Device
       ├─→ Notification
       └─→ LoginHistory

Admin (independent)

OtpVerification (temporary, standalone)
```

---

## 🚀 Deployment Architecture

### Current Setup

```
┌──────────────────┐
│   Development    │
├──────────────────┤
│ • Local PostgreSQL│
│ • Local apps     │
│ • Hot reload     │
└──────────────────┘

┌──────────────────┐
│    Production    │
├──────────────────┤
│ • Vercel (apps)  │
│ • Supabase (DB)  │
│ • Firebase Auth  │
└──────────────────┘
```

### Scaling Strategy (Future)

```
Load Balancer
     ↓
┌────┴────┐
│  API    │ (Multiple instances)
│ Servers │
└────┬────┘
     ↓
┌────┴────┐
│Database │ (Primary + Replicas)
│ Cluster │
└─────────┘
```

---

## 🔧 Build & Development

### Development Workflow

```bash
# Install dependencies
yarn install

# Generate Prisma client
yarn db:generate

# Start development
yarn dev:admin      # Admin portal
yarn dev:mobile     # Mobile app
yarn dev:api        # API server
```

### Build Process

```
Turborepo
  ↓
Build Packages (@pingclub/*)
  ↓
Build Apps (admin-portal, mobile-app, api-server)
  ↓
Run Tests
  ↓
Deploy
```

### CI/CD Pipeline (Recommended)

```
GitHub Push
  ↓
Run Tests
  ↓
Build Packages
  ↓
Build Apps
  ↓
Deploy to Staging
  ↓
Integration Tests
  ↓
Deploy to Production
```

---

## 📦 Package Dependencies

### Dependency Graph

```
admin-portal
  ↓
├─→ @pingclub/database
├─→ @pingclub/auth
└─→ @pingclub/web-ui

mobile-app
  ↓
└─→ @pingclub/mobile-ui

api-server
  ↓
├─→ @pingclub/database
└─→ @pingclub/auth

@pingclub/auth
  ↓
└─→ @pingclub/database

@pingclub/database
  ↓
└─→ @prisma/client
```

---

## 🎨 Design System

### Web Design System

**Package:** `@pingclub/web-ui`

**Exports:**
- Design tokens (colors, typography, spacing)
- Component patterns (future)
- Tailwind configuration

**Used by:**
- Admin Portal

### Mobile Design System

**Package:** `@pingclub/mobile-ui`

**Exports:**
- Design tokens (colors, typography, spacing)
- Component patterns (future)
- NativeWind configuration

**Used by:**
- Mobile App

---

## 🧪 Testing Strategy

### Unit Tests
- Business logic in services
- Utility functions
- Domain entities

### Integration Tests
- API endpoints
- Database operations
- External service integrations

### E2E Tests
- User authentication flows
- Admin portal workflows
- Mobile app critical paths

---

## 📈 Performance Considerations

### Optimization Strategies

1. **Database**
   - Indexed columns
   - Query optimization
   - Connection pooling

2. **API**
   - Response caching
   - Rate limiting
   - Pagination

3. **Frontend**
   - Code splitting
   - Image optimization
   - Bundle size monitoring

4. **Build**
   - Turborepo caching
   - Incremental builds
   - Parallel execution

---

## 🔮 Future Enhancements

### Short Term
- [ ] Add comprehensive test coverage
- [ ] Implement API rate limiting
- [ ] Add Redis for caching
- [ ] Implement proper logging

### Medium Term
- [ ] Migrate to NestJS
- [ ] Add GraphQL API
- [ ] Implement microservices
- [ ] Add message queue (RabbitMQ/Kafka)

### Long Term
- [ ] Multi-tenancy support
- [ ] Advanced analytics
- [ ] Real-time features (WebSocket)
- [ ] AI/ML integration

---

**Last Updated**: December 2025

