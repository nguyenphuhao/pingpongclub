# Authentication Capabilities

## Overview

Pingclub supports multiple authentication methods to provide flexibility and security for different use cases.

## 🔐 Supported Authentication Methods

### 1. Firebase Authentication

**Providers Supported:**
- Google Sign-In
- Facebook Login
- Apple Sign-In
- Other Firebase-supported providers

**Flow:**
```
User → Firebase SDK → ID Token → API Server → Verify Token → Create/Login User
```

**Features:**
- Auto-create user on first login
- Provider information stored
- Email verification status tracked
- Firebase UID stored for future reference

**Technical Details:**
- Uses Firebase Admin SDK for server-side verification
- Supports multiple Firebase providers
- Automatic user provisioning
- Profile data sync from Firebase

---

### 2. OTP Authentication (Email & Phone)

**Supported Channels:**
- Email OTP
- SMS OTP (via Twilio)

**Use Cases:**
- **Registration**: Verify email/phone during signup
- **Login**: Passwordless authentication

**Flow:**
```
1. Request OTP: User enters email/phone → API generates 6-digit code → Send via Email/SMS
2. Verify OTP: User enters code → API validates → Create/Login user
```

**Security Features:**
- 6-digit random code
- 10-minute expiration
- Maximum 3 failed attempts
- One-time use (verified flag)
- Rate limiting protection

**Implementation:**
- Email: SendGrid integration
- SMS: Twilio integration
- OTP storage in database with expiration
- Automatic cleanup of expired OTPs

---

### 3. Password Authentication

**Supported Identifiers:**
- Email + Password
- Phone Number + Password

**Security:**
- bcrypt hashing with 10 salt rounds
- Minimum password requirements (configurable)
- Password change capability
- Set password for OTP-registered users

**Flow:**
```
1. Registration: User sets password → Hash with bcrypt → Store in database
2. Login: User enters credentials → Verify hash → Generate tokens
```

**Features:**
- Email or phone as identifier
- Password strength validation
- Change password (with old password verification)
- Set password for accounts without password
- Failed login tracking

---

## 🎫 Token Management

### Access Tokens (JWT)

**Purpose:** Short-lived token for API authentication

**Structure:**
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "USER|ADMIN|MODERATOR",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Configuration:**
- Default expiration: 7 days (configurable via `JWT_EXPIRES_IN`)
- Secret key: Environment variable `JWT_SECRET`
- Algorithm: HS256 (HMAC with SHA-256)

**Usage:**
```
Authorization: Bearer <access-token>
```

---

### Refresh Tokens

**Purpose:** Long-lived token to obtain new access tokens

**Features:**
- Stored in database with device information
- Linked to specific device/session
- Can be revoked individually
- Automatic cleanup on expiration

**Device Tracking:**
- Device ID
- Platform (IOS, ANDROID, WEB)
- IP Address
- User Agent
- Last used timestamp

**Security:**
- One refresh token per device/session
- Automatic revocation on logout
- Force logout capability (admin)
- Session expiration (configurable)

---

## 📊 Login History & Audit Trail

### Tracking

Every login attempt (success or failure) is recorded with:
- User ID
- Login method (FIREBASE, OTP_EMAIL, OTP_PHONE, PASSWORD_EMAIL, PASSWORD_PHONE)
- Device information (platform, device ID, model, OS version)
- Network information (IP address, user agent, location)
- Timestamp
- Status (SUCCESS, FAILED)
- Failure reason (if failed)

### Use Cases

1. **Security Monitoring**: Track unusual login patterns
2. **Compliance**: Audit trail for regulatory requirements
3. **User Analytics**: Understand user behavior
4. **Debugging**: Troubleshoot authentication issues

---

## 🔒 Session Management

### Multi-Device Support

- Users can log in from multiple devices simultaneously
- Each device has its own refresh token
- Sessions tracked separately per device

### Session Control

**For Users:**
- View active sessions
- Logout specific device
- Logout all devices

**For Admins:**
- View user's active sessions
- Force logout specific session
- Force logout all user sessions

### Auto-Expiration

- Access tokens expire based on configuration
- Refresh tokens expire after inactivity
- Expired sessions automatically cleaned up

---

## 🎯 Role-Based Access Control (RBAC)

### Available Roles

1. **USER** (Default)
   - Access to user-facing features
   - Manage own profile
   - View own data

2. **ADMIN**
   - Full system access
   - Manage all users
   - Access admin portal
   - View analytics

3. **MODERATOR**
   - Limited admin access
   - Manage users (no delete)
   - View analytics
   - Cannot manage other admins

### Permission Model

```typescript
Permissions = {
  USER: ['profile:read', 'profile:update'],
  MODERATOR: ['users:read', 'users:update', 'analytics:read'],
  ADMIN: ['*'] // All permissions
}
```

---

## 🔐 Security Best Practices

### Implemented

✅ Password hashing with bcrypt
✅ JWT token expiration
✅ Refresh token rotation
✅ Device tracking
✅ IP address logging
✅ Failed login attempt tracking
✅ OTP expiration and attempt limits
✅ HTTPS/TLS enforcement (production)
✅ CORS configuration
✅ Rate limiting on auth endpoints

### Recommendations

⚠️ Enable 2FA for admin accounts (future enhancement)
⚠️ Implement account lockout after failed attempts
⚠️ Add CAPTCHA for repeated failures
⚠️ Monitor for suspicious login patterns
⚠️ Regular security audits
⚠️ Password complexity requirements

---

## 📱 Platform-Specific Considerations

### Mobile App

- Firebase authentication preferred
- OTP as fallback
- Biometric authentication (future)
- Secure token storage
- Background token refresh

### Admin Portal

- Password authentication only
- Separate admin user table
- Session management
- No Firebase authentication

### API Server

- Token-based authentication
- Support all authentication methods
- Device tracking
- Session management

---

## 🔄 Authentication Flow Diagrams

### Firebase Authentication Flow

```
[User] → [Firebase SDK] → [Google/Facebook/Apple]
   ↓
[ID Token]
   ↓
[API: POST /auth/firebase]
   ↓
[Verify Token with Firebase Admin]
   ↓
[Find or Create User]
   ↓
[Generate JWT + Refresh Token]
   ↓
[Record Login History]
   ↓
[Return Tokens to User]
```

### OTP Authentication Flow

```
Registration:
[User] → [POST /auth/register/otp] → [Generate OTP] → [Send Email/SMS]
   ↓
[User Enters OTP] → [POST /auth/register/verify] → [Verify Code]
   ↓
[Create User] → [Generate Tokens] → [Return to User]

Login:
[User] → [POST /auth/login/otp] → [Generate OTP] → [Send Email/SMS]
   ↓
[User Enters OTP] → [POST /auth/login/verify] → [Verify Code]
   ↓
[Find User] → [Generate Tokens] → [Return to User]
```

### Password Authentication Flow

```
[User] → [POST /auth/login/password]
   ↓
[Find User by Email/Phone]
   ↓
[Verify Password with bcrypt]
   ↓
[Check User Status]
   ↓
[Generate JWT + Refresh Token]
   ↓
[Record Login History]
   ↓
[Return Tokens to User]
```

---

## 🛠️ Technical Implementation

### Backend

**Location:** `apps/api-server/src/server/modules/auth/`

**Key Services:**
- `AuthService`: Main authentication logic
- `JwtService`: Token generation and verification
- `OtpService`: OTP generation and verification
- `LoginHistoryService`: Audit trail tracking

**Adapters:**
- `FirebaseAuthAdapter`: Firebase Admin SDK integration
- `EmailAdapter`: SendGrid integration
- `SmsAdapter`: Twilio integration

### Shared Packages

**@pingclub/auth:**
- Password hashing utilities
- Admin authentication
- Shared auth types

**@pingclub/database:**
- User model
- RefreshToken model
- OtpVerification model
- LoginHistory model

---

## 📚 API Endpoints

See [Authentication API Documentation](../api/authentication-api.md) for detailed endpoint specifications.

---

**Last Updated**: December 2025

