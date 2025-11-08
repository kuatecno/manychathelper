import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { z } from 'zod';

/**
 * Webhook Subscription Management API
 *
 * GET /api/admin/webhooks - List all webhook subscriptions
 * POST /api/admin/webhooks - Create new webhook subscription
 */

// Validation schema for webhook creation
const CreateWebhookSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.string()).min(1, 'At least one event must be specified'),
  description: z.string().optional(),
  retryAttempts: z.number().int().min(0).max(10).default(3),
  retryDelay: z.number().int().min(1).max(3600).default(60),
  timeoutMs: z.number().int().min(1000).max(60000).default(10000),
});

/**
 * GET /api/admin/webhooks
 * List all webhook subscriptions for the authenticated admin
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to get adminId
    const adminId = request.headers.get('x-admin-id') || 'default-admin';

    const webhooks = await prisma.webhookSubscription.findMany({
      where: { adminId },
      include: {
        _count: {
          select: { deliveries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Parse events JSON for each webhook
    const webhooksWithParsedEvents = webhooks.map((webhook) => ({
      ...webhook,
      events: JSON.parse(webhook.events),
    }));

    return NextResponse.json({
      success: true,
      webhooks: webhooksWithParsedEvents,
      count: webhooks.length,
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch webhooks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/webhooks
 * Create a new webhook subscription
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to get adminId
    const adminId = request.headers.get('x-admin-id') || 'default-admin';

    const body = await request.json();

    // Validate input
    const validated = CreateWebhookSchema.parse(body);

    // Generate secret for HMAC signature
    const secret = crypto.randomBytes(32).toString('hex');

    // Create webhook subscription
    const webhook = await prisma.webhookSubscription.create({
      data: {
        adminId,
        name: validated.name || `Webhook ${new Date().toISOString()}`,
        url: validated.url,
        events: JSON.stringify(validated.events),
        secret,
        description: validated.description,
        retryAttempts: validated.retryAttempts,
        retryDelay: validated.retryDelay,
        timeoutMs: validated.timeoutMs,
      },
    });

    return NextResponse.json({
      success: true,
      webhook: {
        ...webhook,
        events: JSON.parse(webhook.events),
      },
      message: 'Webhook subscription created successfully',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create webhook subscription' },
      { status: 500 }
    );
  }
}
