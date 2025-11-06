import { prisma } from './prisma';
import crypto from 'crypto';

/**
 * Webhook Delivery Service
 *
 * Handles sending webhooks with HMAC signatures, retry logic, and delivery tracking
 */

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
  metadata?: any;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  durationMs?: number;
  error?: string;
  deliveryId?: string;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 * Reuses the pattern from verification.ts
 */
export function generateWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify webhook signature (for incoming webhooks to our system)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Send webhook to external endpoint
 * Returns delivery result with status and error information
 */
export async function sendWebhook(
  subscription: {
    id: string;
    url: string;
    secret: string;
    timeoutMs: number;
    active: boolean;
  },
  payload: WebhookPayload,
  attempt: number = 1
): Promise<WebhookDeliveryResult> {
  const startTime = Date.now();

  // Check if subscription is active
  if (!subscription.active) {
    return {
      success: false,
      error: 'Webhook subscription is inactive',
    };
  }

  try {
    // Serialize payload
    const payloadString = JSON.stringify(payload);
    const payloadSizeBytes = Buffer.byteLength(payloadString, 'utf8');

    // Generate signature
    const signature = generateWebhookSignature(payloadString, subscription.secret);

    // Create delivery record
    const delivery = await prisma.webhookDelivery.create({
      data: {
        subscriptionId: subscription.id,
        event: payload.event,
        payload: payloadString,
        payloadSizeBytes,
        status: 'pending',
        attempt,
      },
    });

    // Send HTTP POST request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), subscription.timeoutMs);

    try {
      const response = await fetch(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
          'X-Webhook-Timestamp': payload.timestamp,
          'X-Webhook-ID': delivery.id,
          'X-Webhook-Attempt': attempt.toString(),
          'User-Agent': 'Flowkick-Webhook/1.0',
        },
        body: payloadString,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const durationMs = Date.now() - startTime;
      const statusCode = response.status;
      const responseBody = await response.text().catch(() => '');

      // Determine success based on status code (2xx = success)
      const success = statusCode >= 200 && statusCode < 300;

      // Update delivery record
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: success ? 'success' : 'failed',
          statusCode,
          responseBody: responseBody.substring(0, 1000), // Truncate to 1000 chars
          durationMs,
          errorMessage: success ? null : `HTTP ${statusCode}: ${responseBody.substring(0, 200)}`,
        },
      });

      // Update subscription statistics
      await prisma.webhookSubscription.update({
        where: { id: subscription.id },
        data: {
          lastDeliveryAt: new Date(),
          lastDeliveryStatus: success ? 'success' : 'failed',
          successCount: success ? { increment: 1 } : undefined,
          failedCount: success ? undefined : { increment: 1 },
        },
      });

      return {
        success,
        statusCode,
        durationMs,
        deliveryId: delivery.id,
        error: success ? undefined : `HTTP ${statusCode}`,
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      const durationMs = Date.now() - startTime;
      const errorMessage = fetchError.name === 'AbortError'
        ? `Timeout after ${subscription.timeoutMs}ms`
        : fetchError.message || 'Network error';

      // Update delivery record with error
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'failed',
          durationMs,
          errorMessage,
        },
      });

      // Update subscription statistics
      await prisma.webhookSubscription.update({
        where: { id: subscription.id },
        data: {
          lastDeliveryAt: new Date(),
          lastDeliveryStatus: 'failed',
          failedCount: { increment: 1 },
        },
      });

      return {
        success: false,
        durationMs,
        error: errorMessage,
        deliveryId: delivery.id,
      };
    }
  } catch (error: any) {
    console.error('Webhook delivery error:', error);
    return {
      success: false,
      error: error.message || 'Internal error',
    };
  }
}

/**
 * Send webhook with retry logic
 * Automatically retries failed deliveries based on subscription settings
 */
export async function sendWebhookWithRetry(
  subscription: {
    id: string;
    url: string;
    secret: string;
    timeoutMs: number;
    active: boolean;
    retryAttempts: number;
    retryDelay: number;
  },
  payload: WebhookPayload
): Promise<WebhookDeliveryResult> {
  let lastResult: WebhookDeliveryResult = { success: false };

  for (let attempt = 1; attempt <= subscription.retryAttempts + 1; attempt++) {
    // Delay before retry (except for first attempt)
    if (attempt > 1) {
      await new Promise(resolve => setTimeout(resolve, subscription.retryDelay * 1000));
    }

    lastResult = await sendWebhook(subscription, payload, attempt);

    // If successful, no need to retry
    if (lastResult.success) {
      break;
    }

    // Log retry attempt
    console.log(
      `Webhook delivery failed (attempt ${attempt}/${subscription.retryAttempts + 1}):`,
      lastResult.error
    );
  }

  return lastResult;
}

/**
 * Get available webhook event types
 * These are the events that can be subscribed to
 */
export const WEBHOOK_EVENTS = {
  // User events
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',

  // Booking events
  BOOKING_CREATED: 'booking.created',
  BOOKING_UPDATED: 'booking.updated',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_COMPLETED: 'booking.completed',

  // QR Code events
  QR_CREATED: 'qr.created',
  QR_SCANNED: 'qr.scanned',
  QR_VALIDATED: 'qr.validated',

  // Tag events
  TAG_ADDED: 'tag.added',
  TAG_REMOVED: 'tag.removed',

  // Custom field events
  CUSTOM_FIELD_UPDATED: 'customfield.updated',

  // Test event
  WEBHOOK_TEST: 'webhook.test',
} as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

/**
 * Emit webhook event to all subscribed webhooks
 * This is the main function that will be called when events occur
 */
export async function emitWebhookEvent(
  adminId: string,
  event: WebhookEvent,
  data: any,
  metadata?: any
): Promise<void> {
  try {
    // Find all active webhooks subscribed to this event
    const subscriptions = await prisma.webhookSubscription.findMany({
      where: {
        adminId,
        active: true,
      },
    });

    // Filter subscriptions that are listening to this event
    const relevantSubscriptions = subscriptions.filter((sub) => {
      const events = JSON.parse(sub.events) as string[];
      return events.includes(event) || events.includes('*'); // * = all events
    });

    if (relevantSubscriptions.length === 0) {
      console.log(`No webhooks subscribed to event: ${event}`);
      return;
    }

    // Prepare payload
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      metadata,
    };

    // Send to all subscriptions (in parallel for speed)
    const deliveryPromises = relevantSubscriptions.map((subscription) =>
      sendWebhookWithRetry(subscription, payload)
    );

    const results = await Promise.allSettled(deliveryPromises);

    // Log results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(
      `Webhook event "${event}" delivered to ${successful}/${results.length} subscriptions (${failed} failed)`
    );
  } catch (error) {
    console.error('Error emitting webhook event:', error);
  }
}
