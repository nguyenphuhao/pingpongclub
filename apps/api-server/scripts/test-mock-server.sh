#!/bin/bash

# Test Mock Notification Server
# Usage: ./scripts/test-mock-server.sh

echo "🧪 Testing Mock Notification Server"
echo "===================================="
echo ""

MOCK_URL="http://localhost:9000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if mock server is running
echo "1️⃣  Checking if mock server is running..."
if curl -s "${MOCK_URL}/health" > /dev/null; then
    echo -e "${GREEN}✅ Mock server is running${NC}"
else
    echo -e "${RED}❌ Mock server is NOT running${NC}"
    echo "   Please run: yarn mock:server"
    exit 1
fi

echo ""
echo "2️⃣  Testing Email API..."

# Test sending email
EMAIL_RESPONSE=$(curl -s -X POST "${MOCK_URL}/api/email" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "from": "noreply@dokifree.com",
    "subject": "Test Email from Script",
    "html": "<h1>Hello World</h1><p>This is a test email from the test script.</p>",
    "text": "Hello World - This is a test email from the test script."
  }')

if echo "$EMAIL_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ Email sent successfully${NC}"
    echo "   Response: $EMAIL_RESPONSE"
else
    echo -e "${RED}❌ Failed to send email${NC}"
    echo "   Response: $EMAIL_RESPONSE"
fi

echo ""
echo "3️⃣  Testing SMS API..."

# Test sending SMS
SMS_RESPONSE=$(curl -s -X POST "${MOCK_URL}/api/sms" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+84901234567",
    "from": "+15555551234",
    "message": "Test SMS from script. Your OTP is: 123456"
  }')

if echo "$SMS_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ SMS sent successfully${NC}"
    echo "   Response: $SMS_RESPONSE"
else
    echo -e "${RED}❌ Failed to send SMS${NC}"
    echo "   Response: $SMS_RESPONSE"
fi

echo ""
echo "4️⃣  Checking stored messages..."

# Get emails
EMAILS=$(curl -s "${MOCK_URL}/api/emails")
EMAIL_COUNT=$(echo "$EMAILS" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')

echo -e "${YELLOW}📧 Total emails: ${EMAIL_COUNT}${NC}"

# Get SMS
SMS_LIST=$(curl -s "${MOCK_URL}/api/sms")
SMS_COUNT=$(echo "$SMS_LIST" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')

echo -e "${YELLOW}📱 Total SMS: ${SMS_COUNT}${NC}"

echo ""
echo "5️⃣  Testing Health Check..."

HEALTH=$(curl -s "${MOCK_URL}/health")
echo "   $HEALTH"

echo ""
echo "===================================="
echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "📍 Open Web UI: ${MOCK_URL}"
echo ""
echo "💡 Tips:"
echo "   - View emails: ${MOCK_URL}/#emails"
echo "   - View SMS: ${MOCK_URL}/#sms"
echo "   - Clear all: Click 'Clear All' button in UI"
echo ""

