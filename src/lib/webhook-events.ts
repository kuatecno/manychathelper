/**
 * Webhook Event Emitter for Data Changes
 *
 * This module provides helper functions to emit webhook events
 * throughout the application when data changes occur.
 */

import { prisma } from './prisma';
import { emitWebhookEvent, WEBHOOK_EVENTS } from './webhook-service';

/**
 * Prepare user data for webhook payload
 * Includes all relevant user information and stats
 */
export async function prepareUserWebhookPayload(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      contactTags: {
        include: { tag: true },
      },
      customFieldValues: {
        include: { field: true },
      },
      _count: {
        select: {
          bookings: true,
          qrCodes: true,
          conversations: true,
          interactionHistory: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  // Get latest interaction counts
  const latestInteraction = await prisma.interactionHistory.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  });

  // Get latest booking
  const latestBooking = await prisma.booking.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  // Transform to clean format
  return {
    id: user.id,
    manychatId: user.manychatId,
    instagramUsername: user.igUsername,
    instagramId: user.instagramId,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
    email: user.email,
    phone: user.phone,
    whatsappPhone: user.whatsappPhone,
    gender: user.gender,
    locale: user.locale,
    timezone: user.timezone,
    profilePic: user.profilePic,
    optIns: {
      messenger: user.optedInMessenger,
      instagram: user.optedInInstagram,
      whatsapp: user.optedInWhatsapp,
      telegram: user.optedInTelegram,
    },
    exportConsent: {
      given: user.exportConsentGiven,
      at: user.exportConsentAt?.toISOString(),
    },
    tags: user.contactTags.map((ct) => ({
      id: ct.tag.id,
      name: ct.tag.name,
      appliedAt: ct.appliedAt.toISOString(),
    })),
    customFields: Object.fromEntries(
      user.customFieldValues.map((cfv) => [
        cfv.field.name,
        cfv.value,
      ])
    ),
    interactions: latestInteraction ? {
      messagesCount: latestInteraction.messagesCount,
      commentsCount: latestInteraction.commentsCount,
      storiesCount: latestInteraction.storiesCount,
      totalCount: latestInteraction.totalCount,
      lastUpdated: latestInteraction.date.toISOString(),
    } : null,
    stats: {
      bookingsCount: user._count.bookings,
      qrScansCount: user._count.qrCodes,
      conversationsCount: user._count.conversations,
      lastBooking: latestBooking?.startTime.toISOString(),
      lastSynced: user.lastSyncedAt?.toISOString(),
    },
    timestamps: {
      subscribedAt: user.subscribedAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
  };
}

/**
 * Emit user created event
 */
export async function emitUserCreated(adminId: string, userId: string) {
  const userData = await prepareUserWebhookPayload(userId);
  if (!userData) return;

  await emitWebhookEvent(adminId, WEBHOOK_EVENTS.USER_CREATED, {
    user: userData,
  }, {
    source: 'manychat_sync',
    action: 'created',
  });
}

/**
 * Emit user updated event
 */
export async function emitUserUpdated(
  adminId: string,
  userId: string,
  changes?: Record<string, { old: any; new: any }>
) {
  const userData = await prepareUserWebhookPayload(userId);
  if (!userData) return;

  await emitWebhookEvent(adminId, WEBHOOK_EVENTS.USER_UPDATED, {
    user: userData,
    changes,
  }, {
    source: 'manychat_sync',
    action: 'updated',
  });
}

/**
 * Prepare booking data for webhook payload
 */
export async function prepareBookingWebhookPayload(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: true,
      tool: true,
    },
  });

  if (!booking) return null;

  return {
    id: booking.id,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    status: booking.status,
    notes: booking.notes,
    tool: {
      id: booking.tool.id,
      name: booking.tool.name,
      type: booking.tool.type,
    },
    user: {
      id: booking.user.id,
      manychatId: booking.user.manychatId,
      instagramUsername: booking.user.igUsername,
      firstName: booking.user.firstName,
      lastName: booking.user.lastName,
      email: booking.user.email,
      phone: booking.user.phone,
    },
    timestamps: {
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    },
  };
}

/**
 * Emit booking created event
 */
export async function emitBookingCreated(adminId: string, bookingId: string) {
  const bookingData = await prepareBookingWebhookPayload(bookingId);
  if (!bookingData) return;

  await emitWebhookEvent(adminId, WEBHOOK_EVENTS.BOOKING_CREATED, {
    booking: bookingData,
  });
}

/**
 * Emit booking updated event
 */
export async function emitBookingUpdated(adminId: string, bookingId: string, oldStatus?: string) {
  const bookingData = await prepareBookingWebhookPayload(bookingId);
  if (!bookingData) return;

  await emitWebhookEvent(adminId, WEBHOOK_EVENTS.BOOKING_UPDATED, {
    booking: bookingData,
    changes: oldStatus ? {
      status: { old: oldStatus, new: bookingData.status },
    } : undefined,
  });
}

/**
 * Emit booking cancelled event
 */
export async function emitBookingCancelled(adminId: string, bookingId: string) {
  const bookingData = await prepareBookingWebhookPayload(bookingId);
  if (!bookingData) return;

  await emitWebhookEvent(adminId, WEBHOOK_EVENTS.BOOKING_CANCELLED, {
    booking: bookingData,
  });
}

/**
 * Emit booking completed event
 */
export async function emitBookingCompleted(adminId: string, bookingId: string) {
  const bookingData = await prepareBookingWebhookPayload(bookingId);
  if (!bookingData) return;

  await emitWebhookEvent(adminId, WEBHOOK_EVENTS.BOOKING_COMPLETED, {
    booking: bookingData,
  });
}

/**
 * Prepare QR code data for webhook payload
 */
export async function prepareQRCodeWebhookPayload(qrCodeId: string) {
  const qrCode = await prisma.qRCode.findUnique({
    where: { id: qrCodeId },
    include: {
      user: true,
      tool: true,
    },
  });

  if (!qrCode) return null;

  return {
    id: qrCode.id,
    code: qrCode.code,
    type: qrCode.type,
    metadata: qrCode.metadata ? JSON.parse(qrCode.metadata) : null,
    active: qrCode.active,
    expiresAt: qrCode.expiresAt?.toISOString(),
    scannedAt: qrCode.scannedAt?.toISOString(),
    scannedBy: qrCode.scannedBy,
    tool: {
      id: qrCode.tool.id,
      name: qrCode.tool.name,
      type: qrCode.tool.type,
    },
    user: {
      id: qrCode.user.id,
      manychatId: qrCode.user.manychatId,
      instagramUsername: qrCode.user.igUsername,
      firstName: qrCode.user.firstName,
      lastName: qrCode.user.lastName,
    },
    createdAt: qrCode.createdAt.toISOString(),
  };
}

/**
 * Emit QR code scanned event
 */
export async function emitQRScanned(adminId: string, qrCodeId: string, scannedBy?: string) {
  const qrData = await prepareQRCodeWebhookPayload(qrCodeId);
  if (!qrData) return;

  await emitWebhookEvent(adminId, WEBHOOK_EVENTS.QR_SCANNED, {
    qrCode: qrData,
    scannedBy,
  });
}

/**
 * Emit QR code validated event
 */
export async function emitQRValidated(adminId: string, qrCodeId: string) {
  const qrData = await prepareQRCodeWebhookPayload(qrCodeId);
  if (!qrData) return;

  await emitWebhookEvent(adminId, WEBHOOK_EVENTS.QR_VALIDATED, {
    qrCode: qrData,
  });
}

/**
 * Emit tag added event
 */
export async function emitTagAdded(adminId: string, userId: string, tagName: string) {
  const userData = await prepareUserWebhookPayload(userId);
  if (!userData) return;

  await emitWebhookEvent(adminId, WEBHOOK_EVENTS.TAG_ADDED, {
    user: userData,
    tag: {
      name: tagName,
    },
  });
}

/**
 * Emit tag removed event
 */
export async function emitTagRemoved(adminId: string, userId: string, tagName: string) {
  const userData = await prepareUserWebhookPayload(userId);
  if (!userData) return;

  await emitWebhookEvent(adminId, WEBHOOK_EVENTS.TAG_REMOVED, {
    user: userData,
    tag: {
      name: tagName,
    },
  });
}

/**
 * Emit custom field updated event
 */
export async function emitCustomFieldUpdated(
  adminId: string,
  userId: string,
  fieldName: string,
  oldValue: any,
  newValue: any
) {
  const userData = await prepareUserWebhookPayload(userId);
  if (!userData) return;

  await emitWebhookEvent(adminId, WEBHOOK_EVENTS.CUSTOM_FIELD_UPDATED, {
    user: userData,
    field: {
      name: fieldName,
      oldValue,
      newValue,
    },
  });
}
