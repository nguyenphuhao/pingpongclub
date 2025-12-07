# Mock Notification Server

Mock server để giả lập SendGrid (Email) và Twilio (SMS) trong môi trường local development.

## 🚀 Khởi chạy

### Chạy riêng lẻ (Local)

```bash
# Cài dependencies (nếu chưa có)
yarn install

# Chạy mock server
yarn mock:server
```

Mock server sẽ chạy tại: http://localhost:9000

### Chạy cùng với app (recommended)

```bash
# Chạy cả mock server và Next.js app cùng lúc
yarn dev:all
```

### Chạy với Docker

```bash
# Start tất cả services (postgres, redis, pgadmin, mock-server)
yarn docker:up

# Hoặc chỉ start mock server
docker-compose up mock-server -d
```

## 📖 Sử dụng

### 1. Cấu hình `.env`

Thêm vào file `.env`:

```bash
USE_MOCK_SERVER=true
MOCK_SERVER_URL=http://localhost:9000
```

### 2. Xem giao diện Web UI

Mở browser tại: http://localhost:9000

Giao diện hiển thị:
- ✅ Danh sách emails đã gửi
- ✅ Danh sách SMS đã gửi
- ✅ Nội dung chi tiết từng message
- ✅ Auto refresh mỗi 3 giây
- ✅ Xóa messages

### 3. API Endpoints

#### Gửi Email
```bash
POST http://localhost:9000/api/email
Content-Type: application/json

{
  "to": "user@example.com",
  "from": "noreply@dokifree.com",
  "subject": "Test Email",
  "html": "<h1>Hello World</h1>",
  "text": "Hello World"
}
```

#### Gửi SMS
```bash
POST http://localhost:9000/api/sms
Content-Type: application/json

{
  "to": "+84901234567",
  "from": "+15555551234",
  "message": "Your OTP is: 123456"
}
```

#### Xem danh sách
```bash
GET http://localhost:9000/api/emails
GET http://localhost:9000/api/sms
```

#### Xóa tất cả
```bash
DELETE http://localhost:9000/api/emails
DELETE http://localhost:9000/api/sms
```

#### Health Check
```bash
GET http://localhost:9000/health
```

## 🔧 Hoạt động

Mock server tự động được sử dụng khi:

1. **Environment variable được set:**
   ```bash
   USE_MOCK_SERVER=true
   ```

2. **Hoặc MOCK_SERVER_URL được cấu hình:**
   ```bash
   MOCK_SERVER_URL=http://localhost:9000
   ```

Khi app gửi email hoặc SMS:
- ✅ Request được gửi tới mock server (thay vì SendGrid/Twilio)
- ✅ Message được lưu trong memory
- ✅ Có thể xem ngay trên web UI
- ✅ Log chi tiết trong console

## 💡 Lợi ích

### ✅ Development
- Không cần API keys thật
- Xem ngay email/SMS được gửi
- Không tốn tiền khi test
- Debug dễ dàng hơn

### ✅ Testing
- Dễ dàng verify nội dung email/SMS
- Không spam inbox thật
- Có thể clear data nhanh chóng

### ✅ Team Collaboration
- Mọi người có thể test notification
- Không cần chia sẻ credentials
- Consistent development environment

## 📊 Storage

- Emails: Lưu tối đa 100 messages gần nhất
- SMS: Lưu tối đa 100 messages gần nhất
- Data lưu trong memory (mất khi restart server)

## 🔍 Debug

### Console Logs
Mock server log mọi request nhận được:

```
📧 [EMAIL] Received: {
  to: 'user@example.com',
  from: 'noreply@dokifree.com',
  subject: 'Welcome to Dokifree',
  timestamp: '2025-11-30T...'
}

📱 [SMS] Received: {
  to: '+84901234567',
  from: '+15555551234',
  message: 'Your OTP is: 123456',
  timestamp: '2025-11-30T...'
}
```

### Fallback Behavior
Nếu mock server không chạy:
- Request sẽ fail gracefully
- Fallback về ConsoleAdapter
- Log ra terminal
- App vẫn hoạt động bình thường

## 🏭 Production

Mock server **KHÔNG** được sử dụng trong production:
- Chỉ dùng khi `NODE_ENV !== 'production'`
- Production tự động dùng SendGrid/Twilio thật
- Không ảnh hưởng deployment

## 🛠️ Technical Details

- **Framework:** Express.js
- **Port:** 9000 (configurable)
- **Storage:** In-memory (không dùng database)
- **Auto-refresh:** 3 seconds
- **CORS:** Enabled cho local development
- **Health check:** `/health` endpoint

## 📦 Docker

Mock server đã được thêm vào `docker-compose.yml`:

```yaml
services:
  mock-server:
    image: node:20-alpine
    ports:
      - '9000:9000'
    healthcheck:
      test: ['CMD', 'wget', '--spider', '-q', 'http://localhost:9000/health']
```

## 🚨 Lưu ý

1. **Không commit `.env`**: Chỉ commit `.env.example`
2. **Mock server chỉ cho local**: Không deploy lên production
3. **Data mất khi restart**: Messages lưu trong memory
4. **Port conflict**: Đảm bảo port 9000 không bị chiếm

## 🎯 Use Cases

### Registration Flow
```
1. User đăng ký → App gửi OTP email
2. Mock server nhận request
3. Dev mở http://localhost:9000
4. Copy OTP từ email trong UI
5. Paste vào form verify
```

### Password Reset
```
1. User quên mật khẩu → App gửi reset link
2. Mock server nhận email
3. Dev copy link từ UI
4. Test reset password flow
```

### SMS OTP
```
1. User login → App gửi SMS OTP
2. Mock server nhận SMS
3. Dev xem OTP trên UI
4. Verify OTP
```

---

**Happy mocking! 🎭**

