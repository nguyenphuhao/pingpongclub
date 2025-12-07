#!/usr/bin/env tsx

/**
 * Mock Notification Server
 * Giả lập SendGrid và Twilio cho local development
 * 
 * Chạy: yarn mock:server
 * Web UI: http://localhost:9000
 */

import express from 'express';
import type { Request, Response } from 'express';

const app = express();
const PORT = process.env.MOCK_SERVER_PORT || 9000;

// Storage for emails and SMS
interface EmailMessage {
  id: string;
  timestamp: string;
  to: string | string[];
  from: string;
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  otpCode?: string;
  verificationId?: string;
}

interface SmsMessage {
  id: string;
  timestamp: string;
  to: string;
  from: string;
  message: string;
  otpCode?: string;
  verificationId?: string;
}

const emails: EmailMessage[] = [];
const smsMessages: SmsMessage[] = [];

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS cho local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ============================================
// API Endpoints
// ============================================

/**
 * POST /api/email
 * Mock SendGrid endpoint
 */
app.post('/api/email', (req: Request, res: Response) => {
  const { to, from, subject, html, text, cc, bcc } = req.body;

  // Extract OTP code and verificationId from email content
  let otpCode: string | undefined;
  let verificationId: string | undefined;
  
  if (html) {
    // Extract OTP (6 digits)
    const otpMatch = html.match(/(\d{6})/);
    if (otpMatch) otpCode = otpMatch[1];
    
    // Extract verificationId
    const verificationIdMatch = html.match(/([a-z0-9]{20,})/i);
    if (verificationIdMatch && verificationIdMatch[1] !== otpCode) {
      verificationId = verificationIdMatch[1];
    }
  }

  const email: EmailMessage = {
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    to,
    from,
    subject,
    html,
    text,
    cc,
    bcc,
    otpCode,
    verificationId,
  };

  emails.unshift(email); // Add to beginning
  
  // Keep only last 100 emails
  if (emails.length > 100) {
    emails.pop();
  }

  console.log('📧 [EMAIL] Received:', {
    to,
    from,
    subject,
    otpCode: otpCode || 'N/A',
    verificationId: verificationId ? verificationId.substring(0, 10) + '...' : 'N/A',
    timestamp: email.timestamp,
  });

  res.json({
    success: true,
    messageId: email.id,
    message: 'Email sent successfully (mocked)',
  });
});

/**
 * POST /api/sms
 * Mock Twilio endpoint
 */
app.post('/api/sms', (req: Request, res: Response) => {
  const { to, from, message } = req.body;

  // Extract OTP code and verificationId from SMS content
  let otpCode: string | undefined;
  let verificationId: string | undefined;
  
  if (message) {
    // Extract OTP (6 digits)
    const otpMatch = message.match(/(\d{6})/);
    if (otpMatch) otpCode = otpMatch[1];
    
    // Extract verificationId (after "Verification ID:")
    const verificationIdMatch = message.match(/Verification ID:\s*([a-z0-9]{20,})/i);
    if (verificationIdMatch) {
      verificationId = verificationIdMatch[1];
    }
  }

  const sms: SmsMessage = {
    id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    to,
    from,
    message,
    otpCode,
    verificationId,
  };

  smsMessages.unshift(sms);
  
  // Keep only last 100 SMS
  if (smsMessages.length > 100) {
    smsMessages.pop();
  }

  console.log('📱 [SMS] Received:', {
    to,
    from,
    message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
    otpCode: otpCode || 'N/A',
    verificationId: verificationId ? verificationId.substring(0, 10) + '...' : 'N/A',
    timestamp: sms.timestamp,
  });

  res.json({
    success: true,
    messageId: sms.id,
    message: 'SMS sent successfully (mocked)',
  });
});

/**
 * GET /api/emails
 * Get all emails
 */
app.get('/api/emails', (req: Request, res: Response) => {
  res.json({
    total: emails.length,
    emails,
  });
});

/**
 * GET /api/sms
 * Get all SMS messages
 */
app.get('/api/sms', (req: Request, res: Response) => {
  res.json({
    total: smsMessages.length,
    sms: smsMessages,
  });
});

/**
 * DELETE /api/emails
 * Clear all emails
 */
app.delete('/api/emails', (req: Request, res: Response) => {
  const count = emails.length;
  emails.length = 0;
  res.json({ success: true, message: `Cleared ${count} emails` });
});

/**
 * DELETE /api/sms
 * Clear all SMS
 */
app.delete('/api/sms', (req: Request, res: Response) => {
  const count = smsMessages.length;
  smsMessages.length = 0;
  res.json({ success: true, message: `Cleared ${count} SMS` });
});

/**
 * GET /health
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    emails: emails.length,
    sms: smsMessages.length,
  });
});

// ============================================
// Web UI
// ============================================

/**
 * GET /
 * Web UI to view emails and SMS
 */
app.get('/', (req: Request, res: Response) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mock Notification Server</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    h1 { font-size: 28px; margin-bottom: 10px; }
    .subtitle { opacity: 0.9; font-size: 14px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value { font-size: 32px; font-weight: bold; color: #667eea; }
    .stat-label { color: #666; font-size: 14px; margin-top: 5px; }
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    .tab {
      padding: 12px 24px;
      background: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .tab:hover { transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.15); }
    .tab.active { background: #667eea; color: white; }
    .content {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      min-height: 400px;
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .message {
      background: #f9f9f9;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e0e0e0;
    }
    .message-meta { font-size: 12px; color: #666; }
    .message-subject { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
    .message-body {
      background: white;
      padding: 15px;
      border-radius: 4px;
      margin-top: 10px;
      border: 1px solid #e0e0e0;
    }
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }
    .empty-state svg {
      width: 80px;
      height: 80px;
      margin-bottom: 20px;
      opacity: 0.3;
    }
    .btn {
      padding: 10px 20px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;
    }
    .btn:hover { background: #5568d3; transform: translateY(-1px); }
    .btn-danger { background: #ef4444; }
    .btn-danger:hover { background: #dc2626; }
    .actions {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      background: #667eea;
      color: white;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 10px;
    }
    pre {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔔 Mock Notification Server</h1>
      <div class="subtitle">Development notification service - SendGrid & Twilio Mock</div>
    </header>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-value" id="email-count">0</div>
        <div class="stat-label">📧 Emails Received</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="sms-count">0</div>
        <div class="stat-label">📱 SMS Received</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="uptime">0s</div>
        <div class="stat-label">⏱️ Uptime</div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" onclick="switchTab('emails')">📧 Emails</button>
      <button class="tab" onclick="switchTab('sms')">📱 SMS Messages</button>
      <button class="tab" onclick="switchTab('api')">📖 API Docs</button>
    </div>

    <div class="content">
      <!-- Emails Tab -->
      <div id="emails" class="tab-content active">
        <div class="actions">
          <button class="btn" onclick="loadEmails()">🔄 Refresh</button>
          <button class="btn btn-danger" onclick="clearEmails()">🗑️ Clear All</button>
        </div>
        <div id="emails-list"></div>
      </div>

      <!-- SMS Tab -->
      <div id="sms" class="tab-content">
        <div class="actions">
          <button class="btn" onclick="loadSms()">🔄 Refresh</button>
          <button class="btn btn-danger" onclick="clearSms()">🗑️ Clear All</button>
        </div>
        <div id="sms-list"></div>
      </div>

      <!-- API Docs Tab -->
      <div id="api" class="tab-content">
        <h2>API Endpoints</h2>
        <br>
        <h3>Send Email</h3>
        <pre>POST /api/email
Content-Type: application/json

{
  "to": "user@example.com",
  "from": "noreply@dokifree.com",
  "subject": "Test Email",
  "html": "<h1>Hello</h1>",
  "text": "Hello"
}</pre>
        <br>
        <h3>Send SMS</h3>
        <pre>POST /api/sms
Content-Type: application/json

{
  "to": "+84901234567",
  "from": "+15555551234",
  "message": "Your OTP is: 123456"
}</pre>
        <br>
        <h3>Get All Messages</h3>
        <pre>GET /api/emails
GET /api/sms</pre>
        <br>
        <h3>Clear Messages</h3>
        <pre>DELETE /api/emails
DELETE /api/sms</pre>
      </div>
    </div>
  </div>

  <script>
    // Auto-refresh every 3 seconds
    setInterval(() => {
      const activeTab = document.querySelector('.tab.active').textContent.includes('Emails') ? 'emails' : 'sms';
      if (activeTab === 'emails') loadEmails();
      else loadSms();
      updateStats();
    }, 3000);

    // Initial load
    loadEmails();
    loadSms();
    updateStats();

    function switchTab(tab) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById(tab).classList.add('active');
      
      if (tab === 'emails') loadEmails();
      else if (tab === 'sms') loadSms();
    }

    async function updateStats() {
      const res = await fetch('/health');
      const data = await res.json();
      document.getElementById('email-count').textContent = data.emails;
      document.getElementById('sms-count').textContent = data.sms;
      document.getElementById('uptime').textContent = Math.floor(data.uptime) + 's';
    }

    async function loadEmails() {
      const res = await fetch('/api/emails');
      const data = await res.json();
      const container = document.getElementById('emails-list');
      
      if (data.emails.length === 0) {
        container.innerHTML = \`
          <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <h3>No emails yet</h3>
            <p>Emails sent from your app will appear here</p>
          </div>
        \`;
        return;
      }

      container.innerHTML = data.emails.map(email => \`
        <div class="message">
          <div class="message-header">
            <div>
              <div class="message-subject">\${email.subject}</div>
              <div class="message-meta">
                <strong>To:</strong> \${Array.isArray(email.to) ? email.to.join(', ') : email.to}<br>
                <strong>From:</strong> \${email.from}<br>
                <strong>Time:</strong> \${new Date(email.timestamp).toLocaleString()}
                \${email.otpCode ? \`<br><strong>🔑 OTP:</strong> <code style="background:#EEF2FF;padding:4px 8px;border-radius:4px;color:#4F46E5;font-size:16px;font-weight:bold;">\${email.otpCode}</code>\` : ''}
                \${email.verificationId ? \`<br><strong>🔐 Verification ID:</strong> <code style="background:#FEF3C7;padding:2px 6px;border-radius:3px;color:#92400E;font-size:11px;font-family:monospace;">\${email.verificationId}</code>\` : ''}
              </div>
            </div>
            <span class="badge">\${email.id}</span>
          </div>
          <div class="message-body">
            \${email.html || '<pre>' + email.text + '</pre>'}
          </div>
        </div>
      \`).join('');
    }

    async function loadSms() {
      const res = await fetch('/api/sms');
      const data = await res.json();
      const container = document.getElementById('sms-list');
      
      if (data.sms.length === 0) {
        container.innerHTML = \`
          <div class="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
            <h3>No SMS yet</h3>
            <p>SMS sent from your app will appear here</p>
          </div>
        \`;
        return;
      }

      container.innerHTML = data.sms.map(sms => \`
        <div class="message">
          <div class="message-header">
            <div class="message-meta">
              <strong>To:</strong> \${sms.to}<br>
              <strong>From:</strong> \${sms.from}<br>
              <strong>Time:</strong> \${new Date(sms.timestamp).toLocaleString()}
              \${sms.otpCode ? \`<br><strong>🔑 OTP:</strong> <code style="background:#EEF2FF;padding:4px 8px;border-radius:4px;color:#4F46E5;font-size:16px;font-weight:bold;">\${sms.otpCode}</code>\` : ''}
              \${sms.verificationId ? \`<br><strong>🔐 Verification ID:</strong> <code style="background:#FEF3C7;padding:2px 6px;border-radius:3px;color:#92400E;font-size:11px;font-family:monospace;">\${sms.verificationId}</code>\` : ''}
            </div>
            <span class="badge">\${sms.id}</span>
          </div>
          <div class="message-body">
            <pre>\${sms.message}</pre>
          </div>
        </div>
      \`).join('');
    }

    async function clearEmails() {
      if (!confirm('Clear all emails?')) return;
      await fetch('/api/emails', { method: 'DELETE' });
      loadEmails();
      updateStats();
    }

    async function clearSms() {
      if (!confirm('Clear all SMS messages?')) return;
      await fetch('/api/sms', { method: 'DELETE' });
      loadSms();
      updateStats();
    }
  </script>
</body>
</html>
  `);
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log('\n===========================================');
  console.log('🚀 Mock Notification Server Started');
  console.log('===========================================');
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`📧 Email API: POST http://localhost:${PORT}/api/email`);
  console.log(`📱 SMS API:   POST http://localhost:${PORT}/api/sms`);
  console.log('===========================================\n');
  console.log('💡 Tip: Mở browser tại http://localhost:' + PORT + ' để xem web UI\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down mock server...');
  process.exit(0);
});

