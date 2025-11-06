# Webhook & CRM Integration Guide

## Overview

This system provides real-time webhook notifications and comprehensive data export capabilities for syncing user data with external CRM systems.

## Features Implemented

### ✅ Phase 1: Webhook Infrastructure (COMPLETED)
- Webhook subscription management
- HMAC-SHA256 signature verification
- Retry logic with exponential backoff
- Delivery tracking and logs

### ✅ Phase 2: Event System (COMPLETED)
- User events (created, updated, deleted)
- Booking events (created, updated, cancelled, completed)
- QR code events (scanned, validated)
- Tag events (added, removed)
- Custom field events (updated)

### ✅ Phase 3: REST API Enhancements (COMPLETED)
- Advanced filtering (date ranges, tags, custom fields, opt-ins)
- Pagination (offset-based and cursor-based)
- Field selection and sorting
- Search functionality

### ✅ Phase 4: Data Export (COMPLETED)
- CSV export with flattened data structure
- JSON export with nested relationships
- Export logging and audit trail
- GDPR compliance (export consent tracking)

---

## Quick Start

### 1. Database Migration

First, generate and run the Prisma migrations:

```bash
npx prisma generate
npx prisma migrate dev --name add_webhook_crm_system
```

Or for production:

```bash
npx prisma migrate deploy
```

### 2. Create a Webhook Subscription

```bash
POST /api/admin/webhooks
Content-Type: application/json
X-Admin-ID: your-admin-id

{
  "name": "My CRM Webhook",
  "url": "https://your-crm.com/webhooks/flowkick",
  "events": ["user.created", "user.updated", "booking.created"],
  "description": "Sync users and bookings to our CRM",
  "retryAttempts": 3,
  "retryDelay": 60,
  "timeoutMs": 10000
}
```

**Response:**
```json
{
  "success": true,
  "webhook": {
    "id": "clx123...",
    "name": "My CRM Webhook",
    "url": "https://your-crm.com/webhooks/flowkick",
    "secret": "a1b2c3d4...", // Save this! Used for signature verification
    "events": ["user.created", "user.updated", "booking.created"],
    "active": true,
    "createdAt": "2025-11-06T10:30:00Z"
  }
}
```

### 3. Verify Webhook Signatures (In Your CRM)

```javascript
// Node.js example
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express.js webhook endpoint
app.post('/webhooks/flowkick', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body.toString();

  if (!verifyWebhookSignature(payload, signature, YOUR_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const data = JSON.parse(payload);
  console.log('Received event:', data.event);
  console.log('User data:', data.data.user);

  // Process the webhook data...

  res.status(200).json({ received: true });
});
```

---

## API Endpoints

### Webhook Management

#### List Webhooks
```http
GET /api/admin/webhooks
X-Admin-ID: your-admin-id
```

#### Get Specific Webhook
```http
GET /api/admin/webhooks/{id}
X-Admin-ID: your-admin-id
```

#### Update Webhook
```http
PATCH /api/admin/webhooks/{id}
Content-Type: application/json
X-Admin-ID: your-admin-id

{
  "active": true,
  "events": ["user.created", "user.updated", "booking.created", "qr.scanned"]
}
```

#### Delete Webhook
```http
DELETE /api/admin/webhooks/{id}
X-Admin-ID: your-admin-id
```

#### Test Webhook
```http
POST /api/admin/webhooks/{id}/test
X-Admin-ID: your-admin-id
```

Sends a test payload to verify your webhook endpoint is working.

### Data Export

#### CSV Export
```http
GET /api/admin/export/users/csv?createdAfter=2025-01-01&hasTag=vip&exportConsentOnly=true
X-Admin-ID: your-admin-id
```

**Query Parameters:**
- `createdAfter` - ISO date (e.g., "2025-01-01")
- `createdBefore` - ISO date
- `updatedAfter` - ISO date
- `hasTag` - Tag name to filter by
- `optedIn` - Platform (messenger, instagram, whatsapp, telegram)
- `search` - Search in firstName, lastName, igUsername, email
- `exportConsentOnly` - Only export users who gave consent (true/false)

#### JSON Export
```http
GET /api/admin/export/users/json?createdAfter=2025-01-01&includeBookings=true&includeQRCodes=true
X-Admin-ID: your-admin-id
```

**Additional Query Parameters:**
- `includeBookings` - Include booking history (true/false)
- `includeQRCodes` - Include QR code history (true/false)
- `includeInteractions` - Include interaction history (true/false)
- `includeConversations` - Include AI chat conversations (true/false)

### Enhanced Users API

```http
GET /api/admin/users?limit=50&offset=0&createdAfter=2025-01-01&hasTag=vip&search=john
X-Admin-ID: your-admin-id
```

**Query Parameters:**
- `limit` - Records per page (default: 50, max: 1000)
- `offset` - Skip N records
- `cursor` - Cursor-based pagination (user ID)
- `createdAfter`, `createdBefore`, `updatedAfter` - Date filters
- `hasTag` - Filter by tag name
- `customField[name]` - Filter by custom field value (e.g., `customField[favorite_drink]=latte`)
- `optedIn` - Filter by opt-in platform
- `search` - Full-text search
- `sortBy` - Sort field (createdAt, updatedAt, firstName, lastName)
- `sortOrder` - Sort order (asc, desc)
- `exportConsentOnly` - Only users with export consent
- `includeBookings`, `includeQRCodes`, `includeInteractions` - Include related data

**Response:**
```json
{
  "success": true,
  "users": [...],
  "pagination": {
    "total": 1250,
    "limit": 50,
    "offset": 0,
    "hasMore": true,
    "nextCursor": "clx123..."
  }
}
```

---

## Webhook Events

### Available Events

| Event | Description | Payload |
|-------|-------------|---------|
| `user.created` | New user created | `{ user }` |
| `user.updated` | User data updated | `{ user, changes }` |
| `booking.created` | New booking created | `{ booking, user }` |
| `booking.updated` | Booking updated | `{ booking, changes }` |
| `booking.cancelled` | Booking cancelled | `{ booking }` |
| `booking.completed` | Booking completed | `{ booking }` |
| `qr.scanned` | QR code scanned | `{ qrCode, user, scannedBy }` |
| `qr.validated` | QR code validated | `{ qrCode, user }` |
| `tag.added` | Tag added to user | `{ user, tag }` |
| `tag.removed` | Tag removed from user | `{ user, tag }` |
| `customfield.updated` | Custom field value changed | `{ user, field }` |

### Webhook Payload Structure

```json
{
  "event": "user.created",
  "timestamp": "2025-11-06T10:30:00.000Z",
  "data": {
    "user": {
      "id": "clx123...",
      "manychatId": "1234567890",
      "instagramUsername": "johndoe",
      "instagramId": "9876543210",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "whatsappPhone": "+1234567890",
      "gender": "male",
      "locale": "en_US",
      "timezone": "America/New_York",
      "profilePic": "https://...",
      "optIns": {
        "messenger": true,
        "instagram": true,
        "whatsapp": false,
        "telegram": false
      },
      "exportConsent": {
        "given": true,
        "at": "2025-11-06T10:00:00.000Z"
      },
      "tags": [
        {
          "id": "clx456...",
          "name": "vip",
          "appliedAt": "2025-11-06T09:00:00.000Z"
        }
      ],
      "customFields": {
        "favorite_drink": "Cappuccino",
        "visit_count": "5",
        "loyalty_points": "150"
      },
      "interactions": {
        "messagesCount": 25,
        "commentsCount": 8,
        "storiesCount": 3,
        "totalCount": 36,
        "lastUpdated": "2025-11-06T10:00:00.000Z"
      },
      "stats": {
        "bookingsCount": 3,
        "qrScansCount": 12,
        "conversationsCount": 2,
        "lastBooking": "2025-11-05T14:30:00.000Z",
        "lastSynced": "2025-11-06T10:30:00.000Z"
      },
      "timestamps": {
        "subscribedAt": "2025-10-01T10:00:00.000Z",
        "createdAt": "2025-10-01T10:00:00.000Z",
        "updatedAt": "2025-11-06T10:30:00.000Z"
      }
    }
  },
  "metadata": {
    "source": "manychat_sync",
    "action": "created"
  }
}
```

---

## Integration with Existing Code

### Step 1: Import Event Emitters

Add webhook event emissions to your existing code:

```typescript
import {
  emitUserCreated,
  emitUserUpdated,
  emitBookingCreated,
  emitQRScanned,
  // ... other emitters
} from '@/lib/webhook-events';
```

### Step 2: Emit Events on Data Changes

#### In Manychat Sync Service

```typescript
// After creating/updating a user
const user = await prisma.user.upsert({
  where: { manychatId: String(subscriber.id) },
  create: { /* ... */ },
  update: { /* ... */ },
});

// Emit webhook event
if (isNewUser) {
  await emitUserCreated(adminId, user.id);
} else {
  await emitUserUpdated(adminId, user.id, {
    email: { old: oldEmail, new: user.email },
    phone: { old: oldPhone, new: user.phone },
  });
}
```

#### In Booking Creation

```typescript
const booking = await prisma.booking.create({
  data: {
    userId,
    toolId,
    startTime,
    endTime,
    status: 'pending',
  },
});

// Emit webhook event
await emitBookingCreated(adminId, booking.id);
```

#### In QR Code Scanning

```typescript
const qrCode = await prisma.qRCode.update({
  where: { code },
  data: {
    scannedAt: new Date(),
    scannedBy: scannerId,
  },
});

// Emit webhook event
await emitQRScanned(adminId, qrCode.id, scannerId);
```

### Step 3: Tag Changes

```typescript
// After adding a tag
await prisma.contactTag.create({
  data: { userId, tagId },
});

await emitTagAdded(adminId, userId, tagName);

// After removing a tag
await prisma.contactTag.delete({
  where: { userId_tagId: { userId, tagId } },
});

await emitTagRemoved(adminId, userId, tagName);
```

---

## Security & Compliance

### GDPR Compliance

1. **Export Consent Tracking**
   - Users have `exportConsentGiven` and `exportConsentAt` fields
   - Filter exports with `exportConsentOnly=true`
   - Audit trail via `DataExport` model

2. **Data Export Logging**
   - All exports are logged in `DataExport` table
   - Includes: who exported, when, what fields, filters used
   - File hashes for integrity verification

3. **User Rights**
   - Right to access: Use JSON export for specific user
   - Right to portability: CSV/JSON export formats
   - Right to be forgotten: Delete user records

### Webhook Security

1. **HMAC Signatures**
   - All webhooks signed with HMAC-SHA256
   - Use `X-Webhook-Signature` header
   - Prevent man-in-the-middle attacks

2. **Retry Logic**
   - Configurable retry attempts (default: 3)
   - Exponential backoff
   - Timeout handling (default: 10s)

3. **Rate Limiting**
   - Webhook subscriptions tracked per admin
   - Failed delivery counts
   - Auto-disable after X consecutive failures (optional enhancement)

---

## Monitoring & Debugging

### View Webhook Deliveries

```http
GET /api/admin/webhooks/{id}
X-Admin-ID: your-admin-id
```

Response includes last 50 deliveries with:
- Status (success/failed)
- HTTP status code
- Response body
- Error messages
- Duration

### View Export Logs

```sql
SELECT * FROM "DataExport"
WHERE "adminId" = 'your-admin-id'
ORDER BY "createdAt" DESC
LIMIT 50;
```

### Webhook Delivery Statistics

```sql
SELECT
  w.name,
  w.successCount,
  w.failedCount,
  w.lastDeliveryStatus,
  w.lastDeliveryAt
FROM "WebhookSubscription" w
WHERE w."adminId" = 'your-admin-id'
AND w.active = true;
```

---

## Example Use Cases

### Use Case 1: Sync to HubSpot

```javascript
// Your HubSpot webhook endpoint
app.post('/webhooks/flowkick', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'user.created' || event === 'user.updated') {
    const { user } = data;

    // Sync to HubSpot
    await hubspot.contacts.createOrUpdate({
      email: user.email,
      properties: {
        firstname: user.firstName,
        lastname: user.lastName,
        phone: user.phone,
        instagram_username: user.instagramUsername,
        // Custom fields
        favorite_drink: user.customFields.favorite_drink,
        visit_count: user.customFields.visit_count,
        // Tags as comma-separated
        tags: user.tags.map(t => t.name).join(','),
      },
    });
  }

  res.status(200).json({ received: true });
});
```

### Use Case 2: Real-time Google Sheets Sync

```javascript
// Using Google Sheets API
app.post('/webhooks/flowkick', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'booking.created') {
    const { booking } = data;

    // Append to Google Sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Bookings!A:F',
      valueInputOption: 'RAW',
      resource: {
        values: [[
          booking.user.firstName,
          booking.user.email,
          booking.startTime,
          booking.endTime,
          booking.status,
          booking.tool.name,
        ]],
      },
    });
  }

  res.status(200).json({ received: true });
});
```

### Use Case 3: Custom Analytics Dashboard

```javascript
// Track user interactions
app.post('/webhooks/flowkick', async (req, res) => {
  const { event, data } = req.body;

  if (event === 'user.updated') {
    const { user } = data;

    // Store in your analytics database
    await analyticsDB.trackUserActivity({
      userId: user.id,
      instagramUsername: user.instagramUsername,
      messagesCount: user.interactions?.messagesCount,
      commentsCount: user.interactions?.commentsCount,
      storiesCount: user.interactions?.storiesCount,
      totalInteractions: user.interactions?.totalCount,
      bookingsCount: user.stats.bookingsCount,
      qrScansCount: user.stats.qrScansCount,
      timestamp: new Date(),
    });
  }

  res.status(200).json({ received: true });
});
```

---

## Testing

### Test Webhook Delivery

```bash
# Send test webhook
curl -X POST http://localhost:3000/api/admin/webhooks/{webhook-id}/test \
  -H "X-Admin-ID: your-admin-id"
```

### Test CSV Export

```bash
curl -X GET "http://localhost:3000/api/admin/export/users/csv?createdAfter=2025-01-01&limit=10" \
  -H "X-Admin-ID: your-admin-id" \
  --output users.csv
```

### Test JSON Export

```bash
curl -X GET "http://localhost:3000/api/admin/export/users/json?includeBookings=true" \
  -H "X-Admin-ID: your-admin-id" \
  --output users.json
```

---

## Troubleshooting

### Webhooks Not Firing

1. Check webhook is active: `GET /api/admin/webhooks`
2. Verify events are subscribed: Check `events` array
3. Check delivery logs: `GET /api/admin/webhooks/{id}`
4. Ensure event emitters are integrated in your code

### Signature Verification Failing

1. Ensure you're using the correct secret from webhook creation response
2. Verify you're hashing the raw request body (not parsed JSON)
3. Use timing-safe comparison to prevent timing attacks

### Export Timeout

1. Add pagination: Use `limit` parameter
2. Use date filters: `createdAfter` to narrow results
3. Avoid including large related data on initial export

---

## Next Steps

1. **Deploy Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```

2. **Integrate Event Emitters**
   - Add to Manychat sync service
   - Add to booking creation/update
   - Add to QR code scanning
   - Add to tag management

3. **Test Webhooks**
   - Create webhook subscription
   - Test with your CRM endpoint
   - Verify signature validation

4. **Monitor**
   - Check delivery logs regularly
   - Set up alerts for failed deliveries
   - Review export logs for compliance

---

## Support

For questions or issues:
- Check webhook delivery logs
- Review export audit trail
- Verify event integrations
- Test with webhook test endpoint

Happy integrating! 🚀
