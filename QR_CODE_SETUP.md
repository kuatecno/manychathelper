# QR Code System Setup Guide

## Overview

The QR code system generates unique QR codes for Instagram users through Manychat. Each QR code contains a unique identifier that can be validated and tracked.

---

## 1. QR Code Value (What the QR Code Contains)

**Current Implementation:**

The QR code contains a **unique code string** generated in this format:
```
{TYPE}-{USER_ID}-{TIMESTAMP}-{RANDOM}
```

**Example:**
```
PROMOTION-clx8h2j9-1738935842156-a7k9p2
```

**Location:** `src/lib/qr.ts` - `generateUniqueCode()` function

**To customize the QR code value:**

```typescript
// Option 1: Change to a URL format
export function generateUniqueCode(userId: string, type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const code = `${type}-${userId.substring(0, 8)}-${timestamp}-${random}`;

  // Return a URL that redirects to validation
  return `https://your-domain.com/qr/validate/${code}`;
}

// Option 2: Simple serial number
export function generateUniqueCode(userId: string, type: string): string {
  return `QR-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

// Option 3: Include business data
export function generateUniqueCode(userId: string, type: string, metadata?: any): string {
  const code = `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  // If you want to embed data directly in QR (not recommended for sensitive data)
  if (metadata?.promoCode) {
    return `PROMO:${metadata.promoCode}:${code}`;
  }

  return code;
}
```

---

## 2. QR Code Appearance (Visual Styling)

**Current Settings:** (in `src/lib/qr.ts`)

```typescript
export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
  return await QRCode.toBuffer(data, {
    errorCorrectionLevel: 'H',  // High error correction
    width: 300,                  // 300x300 pixels
    margin: 2,                   // 2 module border
  });
}
```

**To customize appearance:**

```typescript
export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
  return await QRCode.toBuffer(data, {
    // Error correction level: 'L', 'M', 'Q', 'H' (Low to High)
    // Higher = more damage tolerance but larger QR code
    errorCorrectionLevel: 'H',

    // Size in pixels
    width: 500,

    // Border size (in modules)
    margin: 4,

    // Color options
    color: {
      dark: '#000000',    // QR code color
      light: '#FFFFFF'    // Background color
    },

    // Custom colors example:
    // color: {
    //   dark: '#1a1a1a',   // Dark gray QR
    //   light: '#f0f0f0'   // Light gray background
    // }
  });
}
```

**Advanced Styling Options:**

```typescript
// Add logo in center (requires additional library like 'qrcode-with-logos')
import { QRCodeCanvas } from 'qrcode-with-logos';

// Or use SVG for vector graphics
import QRCode from 'qrcode';
const svgString = await QRCode.toString(data, { type: 'svg' });

// Custom patterns and colors
const buffer = await QRCode.toBuffer(data, {
  width: 600,
  margin: 3,
  color: {
    dark: '#FF5733',  // Brand color
    light: '#000000'  // Black background (inverted)
  }
});
```

---

## 3. Manychat External Request Configuration

### Step 1: Set Up Manychat Flow

In Manychat, create a flow with an **External Request** action:

**Endpoint Configuration:**

```
POST https://your-vercel-app.vercel.app/api/qr/generate
```

**Request Body (JSON):**

```json
{
  "manychat_user_id": "{{subscriber_id}}",
  "type": "promotion",
  "expires_in_days": 30,
  "metadata": {
    "promo_name": "Summer Sale",
    "discount_percentage": 20,
    "campaign_id": "SUMMER2025"
  }
}
```

**Manychat Variables to Use:**
- `{{subscriber_id}}` - Manychat subscriber ID
- `{{first_name}}` - User's first name
- `{{last_name}}` - User's last name
- `{{ig_username}}` - Instagram username

### Step 2: Configure Response Mapping

**API Response Structure:**

```json
{
  "success": true,
  "qr_id": "clx8h2j9p0000...",
  "code": "PROMOTION-clx8h2j9-1738935842156-a7k9p2",
  "type": "promotion",
  "qr_image_url": "https://your-app.vercel.app/api/qr/image/PROMOTION-clx8h2j9-...",
  "expires_at": "2025-11-11T00:00:00.000Z",
  "created_at": "2025-10-11T00:00:00.000Z"
}
```

**In Manychat External Request:**

1. **Save Response to Custom Fields:**
   - Map `qr_image_url` → Custom Field `qr_code_image`
   - Map `code` → Custom Field `qr_code_value`
   - Map `expires_at` → Custom Field `qr_expiry`

2. **Send QR Code to User:**
   - Add "Send Message" action
   - Type: Image
   - Image URL: `{{qr_code_image}}` (the custom field)
   - Caption: "Here's your QR code! Valid until {{qr_expiry}}"

### Step 3: Complete Flow Example

```
Flow: Generate Promo QR Code
├── Trigger: User types "QR CODE"
├── External Request: POST /api/qr/generate
│   └── Body: {"manychat_user_id": "{{subscriber_id}}", "type": "promotion"}
│   └── Save: qr_image_url → qr_code_image
├── Send Message (Image)
│   └── URL: {{qr_code_image}}
│   └── Caption: "🎉 Here's your exclusive QR code!"
└── Send Message (Text)
    └── "Show this code at checkout for your discount!"
```

---

## 4. QR Code Types Configuration

**Current Types:** (in `src/lib/types.ts`)

```typescript
export const GenerateQRSchema = z.object({
  manychat_user_id: z.string(),
  type: z.enum(['promotion', 'validation', 'discount']),  // <-- Types defined here
  metadata: z.record(z.string(), z.any()).optional(),
  expires_in_days: z.number().optional(),
});
```

**To add more types:**

```typescript
// 1. Update the schema
export const GenerateQRSchema = z.object({
  manychat_user_id: z.string(),
  type: z.enum([
    'promotion',
    'validation',
    'discount',
    'event_ticket',      // NEW
    'loyalty_points',    // NEW
    'gift_card',         // NEW
    'membership'         // NEW
  ]),
  metadata: z.record(z.string(), z.any()).optional(),
  expires_in_days: z.number().optional(),
});

// 2. Update Tool configuration in admin panel
// Go to /admin/tools and edit the QR Generator tool
// Update the config JSON:
{
  "allowedTypes": [
    "promotion",
    "validation",
    "discount",
    "event_ticket",
    "loyalty_points",
    "gift_card",
    "membership"
  ],
  "expirationDays": 30
}
```

---

## 5. QR Code Validation Endpoint

**To validate a scanned QR code:**

```
POST /api/qr/validate
```

**Request:**
```json
{
  "code": "PROMOTION-clx8h2j9-1738935842156-a7k9p2",
  "scanned_by": "store_scanner_01"
}
```

**Response:**
```json
{
  "valid": true,
  "type": "promotion",
  "user": {
    "manychatId": "...",
    "firstName": "John",
    "lastName": "Doe"
  },
  "metadata": {
    "promo_name": "Summer Sale",
    "discount_percentage": 20
  },
  "expires_at": "2025-11-11T00:00:00.000Z",
  "scanned_at": "2025-10-11T12:30:00.000Z"
}
```

---

## 6. Metadata Examples

**Promotion QR Code:**
```json
{
  "manychat_user_id": "{{subscriber_id}}",
  "type": "promotion",
  "expires_in_days": 7,
  "metadata": {
    "promo_code": "SUMMER20",
    "discount_type": "percentage",
    "discount_value": 20,
    "min_purchase": 50,
    "max_discount": 100
  }
}
```

**Event Ticket QR Code:**
```json
{
  "manychat_user_id": "{{subscriber_id}}",
  "type": "event_ticket",
  "expires_in_days": 1,
  "metadata": {
    "event_name": "Product Launch",
    "event_date": "2025-11-15T18:00:00Z",
    "seat_number": "A-12",
    "ticket_tier": "VIP"
  }
}
```

**Loyalty Points QR Code:**
```json
{
  "manychat_user_id": "{{subscriber_id}}",
  "type": "loyalty_points",
  "metadata": {
    "points": 100,
    "reason": "Sign-up bonus",
    "tier": "gold"
  }
}
```

---

## 7. Testing the Integration

### Local Testing:

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Test QR generation with curl:**
   ```bash
   curl -X POST http://localhost:3001/api/qr/generate \
     -H "Content-Type: application/json" \
     -d '{
       "manychat_user_id": "test_user_123",
       "type": "promotion",
       "expires_in_days": 30
     }'
   ```

3. **View the QR code image:**
   - Copy the `qr_image_url` from response
   - Open in browser to see the QR code

### Manychat Testing:

1. Set your Manychat External Request to your Vercel URL
2. Send a test message in Manychat
3. Verify the QR code image appears in the chat
4. Scan the QR code with your phone to test

---

## 8. Security Considerations

**Current Implementation:**
- ✅ Unique codes per user
- ✅ Expiration dates supported
- ✅ One-time use tracking (scannedAt field)
- ✅ Metadata for custom data

**Recommended Enhancements:**

```typescript
// Add signature verification
import crypto from 'crypto';

export function generateSecureCode(userId: string, type: string, secret: string): string {
  const data = `${userId}-${type}-${Date.now()}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex')
    .substring(0, 16);

  return `${type.toUpperCase()}-${signature}`;
}

// Verify code authenticity
export function verifyCode(code: string, secret: string): boolean {
  // Implement verification logic
  return true;
}
```

---

## Summary

| Aspect | File Location | What to Customize |
|--------|--------------|-------------------|
| **QR Code Value** | `src/lib/qr.ts` | `generateUniqueCode()` function |
| **QR Appearance** | `src/lib/qr.ts` | `generateQRCodeBuffer()` options |
| **QR Types** | `src/lib/types.ts` | `GenerateQRSchema` enum |
| **Metadata Structure** | Manychat Flow | Request body JSON |
| **Validation Logic** | `src/app/api/qr/validate/route.ts` | Add business rules |

**Manychat Setup:**
1. External Request → `POST /api/qr/generate`
2. Map `qr_image_url` to custom field
3. Send image message with QR code
4. Optional: Add validation flow with `/api/qr/validate`
