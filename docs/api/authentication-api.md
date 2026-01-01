# Authentication API Endpoints

## Base URL

```
Development: http://localhost:3000
Production: https://api.pingclub.com
```

## 🔐 Authentication Endpoints

### 1. Firebase Authentication

**POST** `/api/auth/firebase`

Authenticate using Firebase ID token.

**Request:**
```json
{
  "idToken": "firebase-id-token",
  "deviceId": "device-unique-id",
  "platform": "IOS" | "ANDROID" | "WEB"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "USER",
    "firstName": "John",
    "lastName": "Doe"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "refresh-token",
  "expiresIn": 604800,
  "isNewUser": false
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid token
- `401` - Authentication failed
- `500` - Server error

---

### 2. OTP Registration

#### Request OTP

**POST** `/api/auth/register/otp`

Request OTP code for registration.

**Request:**
```json
{
  "email": "user@example.com",
  // OR
  "phoneNumber": "+84901234567"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "expiresIn": 600,
  "identifier": "user@example.com" | "+84901234567"
}
```

**Status Codes:**
- `200` - OTP sent
- `400` - Invalid email/phone
- `409` - User already exists
- `429` - Rate limit exceeded
- `500` - Failed to send OTP

#### Verify OTP & Register

**POST** `/api/auth/register/verify`

Verify OTP and create user account.

**Request:**
```json
{
  "identifier": "user@example.com" | "+84901234567",
  "otpCode": "123456",
  "deviceId": "device-unique-id",
  "platform": "IOS" | "ANDROID" | "WEB"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "USER"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "refresh-token",
  "expiresIn": 604800
}
```

**Status Codes:**
- `201` - User created
- `400` - Invalid OTP
- `410` - OTP expired
- `429` - Too many attempts
- `500` - Server error

---

### 3. OTP Login

#### Request OTP

**POST** `/api/auth/login/otp`

Request OTP code for login.

**Request:**
```json
{
  "email": "user@example.com",
  // OR
  "phoneNumber": "+84901234567"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "expiresIn": 600,
  "identifier": "user@example.com"
}
```

#### Verify OTP & Login

**POST** `/api/auth/login/verify`

Verify OTP and login.

**Request:**
```json
{
  "identifier": "user@example.com" | "+84901234567",
  "otpCode": "123456",
  "deviceId": "device-unique-id",
  "platform": "IOS" | "ANDROID" | "WEB"
}
```

**Response:**
```json
{
  "user": { ... },
  "accessToken": "jwt-access-token",
  "refreshToken": "refresh-token",
  "expiresIn": 604800
}
```

---

### 4. Password Authentication

**POST** `/api/auth/login/password`

Login with email/phone and password.

**Request:**
```json
{
  "email": "user@example.com",
  // OR
  "phoneNumber": "+84901234567",
  "password": "secure-password",
  "deviceId": "device-unique-id",
  "platform": "IOS" | "ANDROID" | "WEB"
}
```

**Response:**
```json
{
  "user": { ... },
  "accessToken": "jwt-access-token",
  "refreshToken": "refresh-token",
  "expiresIn": 604800
}
```

**Status Codes:**
- `200` - Login successful
- `400` - Invalid credentials
- `401` - Authentication failed
- `403` - Account suspended
- `500` - Server error

---

### 5. Token Management

#### Refresh Token

**POST** `/api/auth/refresh`

Get new access token using refresh token.

**Request:**
```json
{
  "refreshToken": "current-refresh-token"
}
```

**Response:**
```json
{
  "accessToken": "new-jwt-access-token",
  "refreshToken": "new-refresh-token",
  "expiresIn": 604800
}
```

**Status Codes:**
- `200` - Token refreshed
- `401` - Invalid/expired refresh token
- `500` - Server error

#### Logout

**POST** `/api/auth/logout`

Logout and invalidate current session.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request:**
```json
{
  "refreshToken": "current-refresh-token"
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### 6. Password Management

#### Set Password

**POST** `/api/auth/password/set`

Set password for account (e.g., after OTP registration).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request:**
```json
{
  "password": "new-secure-password"
}
```

**Response:**
```json
{
  "message": "Password set successfully"
}
```

#### Change Password

**POST** `/api/auth/password/change`

Change existing password.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request:**
```json
{
  "oldPassword": "current-password",
  "newPassword": "new-secure-password"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

---

### 7. User Info & Sessions

#### Get Current User

**GET** `/api/auth/me`

Get authenticated user information.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "USER",
  "status": "ACTIVE",
  "emailVerified": true,
  "phoneVerified": false
}
```

#### Get Login History

**GET** `/api/auth/login-history?page=1&limit=20`

Get user's login history.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "data": [
    {
      "id": "history-id",
      "loginAt": "2025-12-07T10:00:00Z",
      "platform": "WEB",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "loginMethod": "PASSWORD_EMAIL",
      "status": "SUCCESS"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### Get Active Sessions

**GET** `/api/auth/sessions`

Get all active sessions for current user.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
[
  {
    "id": "token-id",
    "deviceId": "device-1",
    "platform": "WEB",
    "lastUsedAt": "2025-12-07T10:00:00Z",
    "createdAt": "2025-12-01T10:00:00Z"
  }
]
```

#### Logout Specific Device

**DELETE** `/api/auth/sessions/{deviceId}`

Logout from specific device.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "message": "Device logged out successfully"
}
```

---

## 🔑 Admin Authentication

### Admin Login

**POST** `/api/admin/auth/login`

Admin authentication (separate from user auth).

**Request:**
```json
{
  "username": "admin",
  "password": "admin-password"
}
```

**Response:**
```json
{
  "admin": {
    "id": "admin-id",
    "username": "admin",
    "email": "admin@pingclub.com",
    "role": "ADMIN"
  },
  "accessToken": "jwt-token"
}
```

---

## 🔒 Authentication Headers

### Required Header

```
Authorization: Bearer <access-token>
```

### Optional Headers

```
X-Device-ID: <device-unique-id>
X-Platform: IOS | ANDROID | WEB
X-App-Version: 1.0.0
```

---

## 📊 Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `INVALID_TOKEN` | 401 | Invalid JWT token |
| `TOKEN_EXPIRED` | 401 | JWT token expired |
| `INVALID_OTP` | 400 | Wrong OTP code |
| `OTP_EXPIRED` | 410 | OTP has expired |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `USER_SUSPENDED` | 403 | Account suspended |
| `RATE_LIMIT` | 429 | Too many requests |

---

## 🔄 Rate Limiting

### Current Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/register/otp` | 3 requests | 1 minute |
| `/auth/login/otp` | 5 requests | 1 minute |
| `/auth/login/password` | 5 requests | 1 minute |
| `/auth/refresh` | 10 requests | 1 minute |

### Headers

Response includes rate limit headers:
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1234567890
```

---

## 📝 Request Examples

### cURL Examples

#### Firebase Login
```bash
curl -X POST http://localhost:3000/api/auth/firebase \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "firebase-token",
    "deviceId": "web-browser-123",
    "platform": "WEB"
  }'
```

#### Password Login
```bash
curl -X POST http://localhost:3000/api/auth/login/password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "platform": "WEB"
  }'
```

#### Get Current User
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer eyJhbGci..."
```

---

## 🧪 Testing

### Test Accounts

**Development Only:**
```
Email: test@pingclub.com
Password: Test123456
```

**Admin:**
```
Username: admin
Password: admin123
```

---

**Last Updated**: December 2025

