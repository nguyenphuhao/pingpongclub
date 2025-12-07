export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">🚀 Dokifree Backend</h1>
          <p className="text-xl text-gray-600">
            Next.js backend với kiến trúc sẵn sàng migrate sang NestJS
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">📋 API Endpoints</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Auth</h3>
                <ul className="space-y-1 text-sm text-gray-700 ml-4">
                  <li>• POST /api/auth/firebase - Authenticate with Firebase</li>
                  <li>• POST /api/auth/refresh - Refresh access token</li>
                  <li>• POST /api/auth/logout - Logout</li>
                  <li>• GET /api/auth/me - Get current user</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Users</h3>
                <ul className="space-y-1 text-sm text-gray-700 ml-4">
                  <li>• GET /api/users - List users</li>
                  <li>• POST /api/users - Create user</li>
                  <li>• GET /api/users/:id - Get user</li>
                  <li>• PATCH /api/users/:id - Update user</li>
                  <li>• DELETE /api/users/:id - Delete user</li>
                  <li>• GET /api/users/:id/profile - Get public profile</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">🏗️ Kiến trúc</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ Clean Architecture + Domain-Driven Design</li>
              <li>✅ Business logic tách biệt khỏi Next.js</li>
              <li>✅ Repository Pattern</li>
              <li>✅ Shared DTOs với Zod validation</li>
              <li>✅ Firebase Admin SDK integration</li>
              <li>✅ Email & SMS providers (SendGrid, Twilio)</li>
              <li>✅ Push notifications (FCM)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">🔄 Migration Path</h2>
            <p className="text-sm text-gray-700">
              Mỗi module trong <code className="bg-gray-100 px-2 py-1 rounded">src/server/modules/</code> 
              có thể migrate sang NestJS một cách độc lập. Business logic giữ nguyên, 
              chỉ cần wrap với decorators (@Injectable, @Controller, etc).
            </p>
          </section>

          <section className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              📚 Xem README.md để biết thêm chi tiết về cấu trúc và cách phát triển.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

