# Database Schema Documentation

## Overview

Pingclub uses **PostgreSQL** with **Prisma ORM** for type-safe database access.

**Schema Location:** `packages/database/prisma/schema.prisma`

---

## 📊 Schema Overview

```
┌─────────────────────────────────────┐
│       User Management (5 tables)    │
├─────────────────────────────────────┤
│ • users                             │
│ • admin                             │
│ • devices                           │
│ • refresh_tokens                    │
│ • login_history                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    Authentication (1 table)         │
├─────────────────────────────────────┤
│ • otp_verifications                 │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│     Notifications (1 table)         │
├─────────────────────────────────────┤
│ • notifications                     │
└─────────────────────────────────────┘
```

---

## 🗂️ Table Details

### users

**Purpose:** Application users

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique user ID |
| `email` | String | Unique, Indexed | User email |
| `phone` | String | Unique, Nullable | Phone number |
| `firebaseUid` | String | Unique, Nullable, Indexed | Firebase UID |
| `provider` | String | Nullable | Auth provider |
| `password` | String | Nullable | Hashed password |
| `firstName` | String | Nullable | First name |
| `lastName` | String | Nullable | Last name |
| `avatar` | String | Nullable | Avatar URL |
| `role` | UserRole | Default: USER | User role |
| `status` | UserStatus | Default: ACTIVE | Account status |
| `emailVerified` | Boolean | Default: false | Email verification |
| `phoneVerified` | Boolean | Default: false | Phone verification |
| `lastLoginAt` | DateTime | Nullable | Last login timestamp |
| `createdAt` | DateTime | Auto | Created timestamp |
| `updatedAt` | DateTime | Auto | Updated timestamp |
| `deletedAt` | DateTime | Nullable | Soft delete timestamp |

**Enums:**
```typescript
enum UserRole {
  USER
  ADMIN
  MODERATOR
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  DELETED
}
```

**Relations:**
- `refreshTokens`: One-to-many → `RefreshToken[]`
- `notifications`: One-to-many → `Notification[]`
- `devices`: One-to-many → `Device[]`
- `loginHistory`: One-to-many → `LoginHistory[]`

**Indexes:**
- `email` (unique)
- `firebaseUid`
- `provider`

---

### admin

**Purpose:** Admin users (separate from regular users)

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Unique admin ID |
| `username` | String | Unique, Indexed | Admin username |
| `password` | String | Required | Hashed password |
| `firstName` | String | Nullable | First name |
| `lastName` | String | Nullable | Last name |
| `email` | String | Unique, Nullable | Email |
| `avatar` | String | Nullable | Avatar URL |
| `role` | AdminRole | Default: ADMIN | Admin role |
| `status` | AdminStatus | Default: ACTIVE | Account status |
| `lastLoginAt` | DateTime | Nullable | Last login |
| `createdAt` | DateTime | Auto | Created timestamp |
| `updatedAt` | DateTime | Auto | Updated timestamp |
| `deletedAt` | DateTime | Nullable | Soft delete |

**Enums:**
```typescript
enum AdminRole {
  ADMIN
  MODERATOR
}

enum AdminStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  DELETED
}
```

**Indexes:**
- `username` (unique)
- `email` (unique)
- `status`

---

### refresh_tokens

**Purpose:** JWT refresh tokens for session management

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Token ID |
| `token` | String | Unique, Indexed | Refresh token |
| `userId` | String | FK → users, Indexed | User reference |
| `deviceId` | String | Nullable, Indexed | Device identifier |
| `platform` | DevicePlatform | Nullable | Device platform |
| `ipAddress` | String | Nullable | IP address |
| `userAgent` | String | Nullable | Browser/app info |
| `expiresAt` | DateTime | Required | Expiration time |
| `lastUsedAt` | DateTime | Auto | Last used |
| `createdAt` | DateTime | Auto | Created timestamp |

**Enums:**
```typescript
enum DevicePlatform {
  IOS
  ANDROID
  WEB
}
```

**Relations:**
- `user`: Many-to-one → `User`
- `loginHistory`: One-to-one → `LoginHistory`

**Indexes:**
- `userId`
- `token` (unique)
- `deviceId`
- `userId + deviceId` (compound)

---

### otp_verifications

**Purpose:** OTP codes for registration and login

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | OTP record ID |
| `identifier` | String | Indexed | Email or phone |
| `identifierType` | OtpIdentifierType | Required | Type of identifier |
| `otpCode` | String | Indexed | 6-digit code |
| `purpose` | OtpPurpose | Required | Registration or login |
| `verified` | Boolean | Default: false | Verification status |
| `attempts` | Int | Default: 0 | Failed attempts |
| `expiresAt` | DateTime | Required | Expiration time |
| `verifiedAt` | DateTime | Nullable | Verification time |
| `createdAt` | DateTime | Auto | Created timestamp |
| `updatedAt` | DateTime | Auto | Updated timestamp |

**Enums:**
```typescript
enum OtpIdentifierType {
  EMAIL
  PHONE
}

enum OtpPurpose {
  REGISTRATION
  LOGIN
}
```

**Indexes:**
- `identifier + purpose` (compound)
- `otpCode`

**Lifecycle:**
- Created on OTP request
- Verified on successful verification
- Automatically expires after 10 minutes
- Cleaned up periodically

---

### login_history

**Purpose:** Audit trail of all login attempts

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | History record ID |
| `userId` | String | FK → users, Indexed | User reference |
| `platform` | DevicePlatform | Required | Device platform |
| `deviceId` | String | Nullable | Device identifier |
| `deviceModel` | String | Nullable | Device model |
| `osVersion` | String | Nullable | OS version |
| `ipAddress` | String | Nullable | IP address |
| `userAgent` | String | Nullable | Browser/app info |
| `location` | String | Nullable | City, Country |
| `loginMethod` | LoginMethod | Required | Auth method used |
| `status` | LoginStatus | Default: SUCCESS | Success/failure |
| `failureReason` | String | Nullable | Reason if failed |
| `loginAt` | DateTime | Auto, Indexed | Login timestamp |
| `refreshTokenId` | String | Unique, Nullable | Linked token |

**Enums:**
```typescript
enum LoginMethod {
  FIREBASE
  OTP_EMAIL
  OTP_PHONE
  PASSWORD_EMAIL
  PASSWORD_PHONE
}

enum LoginStatus {
  SUCCESS
  FAILED
}
```

**Relations:**
- `user`: Many-to-one → `User`
- `refreshToken`: One-to-one → `RefreshToken`

**Indexes:**
- `userId`
- `loginAt`
- `platform`
- `status`

---

### devices

**Purpose:** User devices for push notifications

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Device record ID |
| `userId` | String | FK → users, Indexed | User reference |
| `fcmToken` | String | Unique, Indexed | FCM push token |
| `platform` | DevicePlatform | Required | Device platform |
| `deviceId` | String | Nullable | Device identifier |
| `model` | String | Nullable | Device model |
| `osVersion` | String | Nullable | OS version |
| `isActive` | Boolean | Default: true | Active status |
| `lastUsedAt` | DateTime | Auto | Last activity |
| `createdAt` | DateTime | Auto | Created timestamp |
| `updatedAt` | DateTime | Auto | Updated timestamp |

**Relations:**
- `user`: Many-to-one → `User`

**Indexes:**
- `userId`
- `fcmToken` (unique)

---

### notifications

**Purpose:** Notification records

**Fields:**
| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | PK, CUID | Notification ID |
| `userId` | String | FK → users, Indexed | User reference |
| `type` | NotificationType | Required | Notification type |
| `channel` | NotificationChannel | Required | Delivery channel |
| `title` | String | Required | Notification title |
| `body` | String | Required | Notification body |
| `data` | Json | Nullable | Additional data |
| `status` | NotificationStatus | Default: PENDING | Delivery status |
| `sentAt` | DateTime | Nullable | Sent timestamp |
| `readAt` | DateTime | Nullable | Read timestamp |
| `error` | String | Nullable | Error message |
| `createdAt` | DateTime | Auto | Created timestamp |
| `updatedAt` | DateTime | Auto | Updated timestamp |

**Enums:**
```typescript
enum NotificationType {
  SYSTEM
  MARKETING
  TRANSACTIONAL
  ALERT
}

enum NotificationChannel {
  EMAIL
  SMS
  PUSH
  IN_APP
}

enum NotificationStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
  READ
}
```

**Relations:**
- `user`: Many-to-one → `User`

**Indexes:**
- `userId`
- `status`
- `type`

---

## 🔗 Relationships Diagram

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     ├─────→ RefreshToken (1:N)
     │       └─→ LoginHistory (1:1)
     │
     ├─────→ Device (1:N)
     │
     ├─────→ Notification (1:N)
     │
     └─────→ LoginHistory (1:N)

┌──────────┐
│  Admin   │  (Independent table, no relations)
└──────────┘

┌───────────────┐
│OtpVerification│  (Standalone, temporary records)
└───────────────┘
```

---

## 🔧 Prisma Configuration

### Generator

```prisma
generator client {
  provider = "prisma-client-js"
}
```

### Datasource

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Connection String Format

```
postgresql://username:password@host:port/database?schema=public
```

---

## 📝 Common Queries

### Find User by Email

```typescript
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
});
```

### Get User with Login History

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    loginHistory: {
      orderBy: { loginAt: 'desc' },
      take: 10
    }
  }
});
```

### Get Active Sessions

```typescript
const sessions = await prisma.refreshToken.findMany({
  where: {
    userId: userId,
    expiresAt: { gte: new Date() }
  },
  orderBy: { lastUsedAt: 'desc' }
});
```

### Create User

```typescript
const user = await prisma.user.create({
  data: {
    email: 'new@example.com',
    role: 'USER',
    status: 'ACTIVE'
  }
});
```

---

## 🔄 Migrations

### Creating Migrations

```bash
# Generate migration
yarn db:migrate

# Apply migrations
yarn workspace @pingclub/database prisma:migrate
```

### Migration Strategy

1. **Development**: `prisma migrate dev`
2. **Production**: `prisma migrate deploy`
3. **Rollback**: Manual via migration files

---

## 🌱 Seeding

**Seed Script:** `packages/database/prisma/seed.ts`

```bash
# Run seed
yarn db:seed
```

**Seed Data:**
- Default admin user
- Test users (development only)
- Sample data

---

## 🔐 Security Considerations

### Sensitive Data

- ✅ Passwords hashed with bcrypt
- ✅ Tokens stored securely
- ✅ Soft deletes (deletedAt)
- ✅ IP addresses logged for audit

### Data Protection

- Row-level security (future)
- Encryption at rest (database level)
- Encrypted connections (SSL/TLS)
- Regular backups

---

## 📊 Performance Optimization

### Indexes

**Existing:**
- All foreign keys indexed
- Unique constraints indexed
- Common query fields indexed

**Recommendations:**
- Composite indexes for common queries
- Partial indexes for filtered queries
- Full-text search indexes (future)

### Query Optimization

- Select only needed fields
- Use pagination
- Eager loading with `include`
- Connection pooling

---

## 🧹 Maintenance

### Cleanup Tasks

**OTP Verifications:**
```sql
DELETE FROM otp_verifications 
WHERE expires_at < NOW() - INTERVAL '1 day';
```

**Expired Refresh Tokens:**
```sql
DELETE FROM refresh_tokens 
WHERE expires_at < NOW();
```

**Old Login History:**
```sql
DELETE FROM login_history 
WHERE login_at < NOW() - INTERVAL '90 days';
```

### Backup Strategy

- Daily backups
- Point-in-time recovery
- Geographic redundancy
- Retention: 30 days

---

**Last Updated**: December 2025

