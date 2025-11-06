import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Individual Webhook Management API
 *
 * GET /api/admin/webhooks/[id] - Get specific webhook
 * PATCH /api/admin/webhooks/[id] - Update webhook
 * DELETE /api/admin/webhooks/[id] - Delete webhook
 */

// Validation schema for webhook updates
const UpdateWebhookSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url('Invalid webhook URL').optional(),
  events: z.array(z.string()).min(1).optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
  retryAttempts: z.number().int().min(0).max(10).optional(),
  retryDelay: z.number().int().min(1).max(3600).optional(),
  timeoutMs: z.number().int().min(1000).max(60000).optional(),
});

/**
 * GET /api/admin/webhooks/[id]
 * Get specific webhook subscription with delivery statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminId = request.headers.get('x-admin-id') || 'default-admin';

    const webhook = await prisma.webhookSubscription.findFirst({
      where: {
        id,
        adminId,
      },
      include: {
        deliveries: {
          orderBy: { sentAt: 'desc' },
          take: 50, // Last 50 deliveries
        },
        _count: {
          select: { deliveries: true },
        },
      },
    });

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      webhook: {
        ...webhook,
        events: JSON.parse(webhook.events),
        deliveries: webhook.deliveries.map((d) => ({
          ...d,
          payload: JSON.parse(d.payload),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch webhook' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/webhooks/[id]
 * Update webhook subscription
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminId = request.headers.get('x-admin-id') || 'default-admin';
    const body = await request.json();

    // Validate input
    const validated = UpdateWebhookSchema.parse(body);

    // Check webhook exists and belongs to admin
    const existing = await prisma.webhookSubscription.findFirst({
      where: { id, adminId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.url !== undefined) updateData.url = validated.url;
    if (validated.events !== undefined) updateData.events = JSON.stringify(validated.events);
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.active !== undefined) updateData.active = validated.active;
    if (validated.retryAttempts !== undefined) updateData.retryAttempts = validated.retryAttempts;
    if (validated.retryDelay !== undefined) updateData.retryDelay = validated.retryDelay;
    if (validated.timeoutMs !== undefined) updateData.timeoutMs = validated.timeoutMs;

    // Update webhook
    const webhook = await prisma.webhookSubscription.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      webhook: {
        ...webhook,
        events: JSON.parse(webhook.events),
      },
      message: 'Webhook updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/webhooks/[id]
 * Delete webhook subscription
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminId = request.headers.get('x-admin-id') || 'default-admin';

    // Check webhook exists and belongs to admin
    const existing = await prisma.webhookSubscription.findFirst({
      where: { id, adminId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Delete webhook (cascade will delete deliveries)
    await prisma.webhookSubscription.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
