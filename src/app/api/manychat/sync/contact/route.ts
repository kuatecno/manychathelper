import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const SyncContactSchema = z.object({
  admin_id: z.string(),
  subscriber_id: z.number(),
});

/**
 * Webhook endpoint - stores subscriber ID only for later full sync
 * This is fast and doesn't hit Manychat API limits
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = SyncContactSchema.parse(body);

    // Check if config exists
    const config = await prisma.manychatConfig.findUnique({
      where: { adminId: validated.admin_id },
    });

    if (!config || !config.active) {
      return NextResponse.json(
        { error: 'Manychat configuration not found or inactive' },
        { status: 404 }
      );
    }

    // Store or update user with just the subscriber ID
    // Full sync will happen on refresh or daily sync
    const user = await prisma.user.upsert({
      where: { manychatId: String(validated.subscriber_id) },
      create: {
        manychatId: String(validated.subscriber_id),
        firstName: null,
        lastName: null,
        // Mark as pending sync
        lastSyncedAt: null,
      },
      update: {
        // Don't overwrite existing data, just ensure user exists
      },
    });

    return NextResponse.json({
      success: true,
      contact_id: user.id,
      message: 'Contact queued for sync',
    });
  } catch (error) {
    console.error('Sync contact error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
