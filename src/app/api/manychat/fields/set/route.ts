import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createManychatClient } from '@/lib/manychat-client';
import { z } from 'zod';

const SetFieldSchema = z.object({
  admin_id: z.string(),
  subscriber_id: z.number(),
  field_id: z.number(),
  field_value: z.any(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = SetFieldSchema.parse(body);

    // Get admin and Manychat config
    const admin = await prisma.admin.findUnique({
      where: { id: validated.admin_id },
      include: { manychatConfig: true },
    });

    if (!admin || !admin.manychatConfig) {
      return NextResponse.json(
        { error: 'Admin or Manychat config not found' },
        { status: 404 }
      );
    }

    // Create Manychat client
    const manychatClient = createManychatClient(admin.manychatConfig.apiToken);

    // Set custom field value via Manychat API
    await manychatClient.setCustomField(
      validated.subscriber_id,
      validated.field_id,
      validated.field_value
    );

    return NextResponse.json({
      success: true,
      message: 'Custom field value set successfully',
    });
  } catch (error) {
    console.error('Error setting custom field:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to set custom field', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
