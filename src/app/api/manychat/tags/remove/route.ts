import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createManychatClient } from '@/lib/manychat-client';
import { z } from 'zod';

const RemoveTagSchema = z.object({
  admin_id: z.string(),
  subscriber_id: z.number(),
  tag_id: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RemoveTagSchema.parse(body);

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

    // Remove tag via Manychat API
    await manychatClient.removeTagFromSubscriber(
      validated.subscriber_id,
      validated.tag_id
    );

    return NextResponse.json({
      success: true,
      message: 'Tag removed successfully',
    });
  } catch (error) {
    console.error('Error removing tag:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to remove tag', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
