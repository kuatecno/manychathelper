# Manychat Helper Service

A powerful Next.js API service for Instagram booking systems and QR code generation via Manychat webhooks.

## Features

- **Booking System**: Create and manage appointments with helpers without AI
- **QR Code Generation**: Generate promotional/validation QR codes for Instagram users
- **Availability Management**: Check real-time helper availability
- **Manychat Integration**: Seamless HTTP request integration

## Quick Start

```bash
# Install dependencies
npm install

# Run database migrations
npm run prisma:push

# Seed database with sample helpers
npm run prisma:seed

# Start development server
npm run dev
```

Server runs on `http://localhost:3001`

## API Endpoints

### 1. List Helpers
```http
GET /api/helpers/list
```

**Response:**
```json
{
  "helpers": [
    {
      "id": "cmgi9kvwk0000suqmbxsvv5h1",
      "name": "John Helper",
      "email": "helper1@example.com",
      "phone": "+1234567890"
    }
  ]
}
```

### 2. Check Availability
```http
GET /api/bookings/availability?helper_id={HELPER_ID}&date=2025-10-08T00:00:00Z
```

**Response:**
```json
{
  "helper_id": "cmgi9kvwk0000suqmbxsvv5h1",
  "date": "2025-10-08T00:00:00Z",
  "available_slots": [
    "2025-10-08T09:00:00.000Z",
    "2025-10-08T09:30:00.000Z",
    "2025-10-08T10:00:00.000Z"
  ]
}
```

### 3. Create Booking
```http
POST /api/bookings/create
Content-Type: application/json

{
  "manychat_user_id": "123456789",
  "helper_id": "cmgi9kvwk0000suqmbxsvv5h1",
  "start_time": "2025-10-08T09:00:00Z",
  "duration": 30,
  "notes": "Instagram consultation"
}
```

**Response:**
```json
{
  "success": true,
  "booking_id": "cmgi9l9vw0002suqm8xskv5h3",
  "helper_name": "John Helper",
  "start_time": "2025-10-08T09:00:00.000Z",
  "end_time": "2025-10-08T09:30:00.000Z",
  "status": "pending"
}
```

### 4. Generate QR Code
```http
POST /api/qr/generate
Content-Type: application/json

{
  "manychat_user_id": "123456789",
  "type": "promotion",
  "metadata": {
    "discount": "20%",
    "campaign": "summer2025"
  },
  "expires_in_days": 7
}
```

**Response:**
```json
{
  "success": true,
  "qr_id": "cmgi9m3vw0003suqm9xtkv5h4",
  "code": "PROMOTION-cmgi9kvw-1728392345-abc123",
  "type": "promotion",
  "qr_image_url": "https://manychathelper.vercel.app/api/qr/image/PROMOTION-cmgi9kvw-1728392345-abc123",
  "expires_at": "2025-10-15T09:00:00.000Z",
  "created_at": "2025-10-08T10:00:00.000Z"
}
```

### 5a. Get QR Code Image
```http
GET /api/qr/image/{code}
```

Returns the QR code as a PNG image. This URL can be used directly in Manychat image fields.

**Example:**
```
https://manychathelper.vercel.app/api/qr/image/PROMOTION-cmgi9kvw-1728392345-abc123
```

### 5. Validate QR Code
```http
POST /api/qr/validate
Content-Type: application/json

{
  "code": "PROMOTION-cmgi9kvw-1728392345-abc123",
  "scanned_by": "staff_member_id"
}
```

**Response:**
```json
{
  "valid": true,
  "qr_id": "cmgi9m3vw0003suqm9xtkv5h4",
  "type": "promotion",
  "user_id": "123456789",
  "user_name": "John Doe",
  "metadata": {
    "discount": "20%",
    "campaign": "summer2025"
  },
  "scanned_at": "2025-10-08T10:30:00.000Z"
}
```

## Manychat Integration Guide

### Use Case 1: Booking System

**Automation Flow:**
1. User sends "Book" to Instagram via Manychat
2. Manychat: External Request → `GET /api/helpers/list`
3. Display helpers as buttons
4. User selects helper
5. Manychat: External Request → `GET /api/bookings/availability`
6. Display available time slots
7. User selects time
8. Manychat: External Request → `POST /api/bookings/create`
9. Show confirmation message

**Manychat Configuration:**
```json
{
  "url": "https://your-domain.com/api/bookings/create",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "manychat_user_id": "{{user_id}}",
    "helper_id": "{{custom_field.selected_helper}}",
    "start_time": "{{custom_field.selected_time}}",
    "duration": 30
  }
}
```

**Response Mapping:**
- Save `booking_id` → Custom Field: "booking_id"
- Save `helper_name` → Custom Field: "helper_name"
- Save `start_time` → Custom Field: "appointment_time"

### Use Case 2: Promotional QR Codes

**Automation Flow:**
1. User sends "Promo" to Instagram
2. Manychat: External Request → `POST /api/qr/generate`
3. Display QR code image in message
4. Staff scans QR from user's phone
5. Manychat (staff bot): External Request → `POST /api/qr/validate`
6. Apply discount/promotion

**Manychat Configuration:**
```json
{
  "url": "https://your-domain.com/api/qr/generate",
  "method": "POST",
  "body": {
    "manychat_user_id": "{{user_id}}",
    "type": "promotion",
    "metadata": {
      "discount": "20%",
      "product": "instagram_course"
    },
    "expires_in_days": 7
  }
}
```

**Response Mapping:**
- Save `qr_image_url` → Custom Field: "user_qr_code" (Image URL)
- Save `code` → Custom Field: "qr_code_text"
- Save `expires_at` → Custom Field: "qr_expires"

**Display QR Code in Manychat:**
Use the `qr_image_url` field directly in Manychat's image element. The URL format:
```
https://manychathelper.vercel.app/api/qr/image/{{custom_field.qr_code_text}}
```

## Database Schema

- **User**: Instagram users connecting via Manychat
- **Helper**: Your staff members providing services
- **Availability**: Weekly availability schedules for helpers
- **Booking**: Appointment records
- **QRCode**: Generated QR codes with metadata

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable
vercel env add DATABASE_URL
```

### Environment Variables
```env
DATABASE_URL="file:./dev.db"  # Development
# or
DATABASE_URL="postgresql://..."  # Production
```

## Tech Stack

- **Next.js 15**: API routes with App Router
- **TypeScript**: Type-safe development
- **Prisma**: Database ORM
- **SQLite/PostgreSQL**: Database
- **QRCode**: QR code generation
- **Zod**: Request validation

## License

ISC
