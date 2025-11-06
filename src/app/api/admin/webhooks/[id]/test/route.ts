import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Webhook Test Endpoint
 *
 * POST /api/admin/webhooks/[id]/test - Send test payload to webhook
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminId = request.headers.get('x-admin-id') || 'default-admin';

    // Find webhook
    const webhook = await prisma.webhookSubscription.findFirst({
      where: { id, adminId },
    });

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Import webhook service (we'll create this next)
    const { sendWebhook } = await import('@/lib/webhook-service');

    // Send test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Flowkick',
        webhookId: webhook.id,
        webhookName: webhook.name,
      },
      metadata: {
        test: true,
      },
    };

    const result = await sendWebhook(webhook, testPayload);

    return NextResponse.json({
      success: true,
      test: {
        sent: true,
        status: result.success ? 'delivered' : 'failed',
        statusCode: result.statusCode,
        responseTime: result.durationMs,
        error: result.error,
      },
      message: result.success
        ? 'Test webhook delivered successfully'
        : 'Test webhook failed to deliver',
    });
  } catch (error) {
    console.error('Error testing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}
