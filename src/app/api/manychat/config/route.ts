import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ConfigSchema = z.object({
  admin_id: z.string(),
  apiToken: z.string().min(1),
  pageId: z.string().optional(),
  syncEnabled: z.boolean().default(true),
  webhookSecret: z.string().optional(),
});

// GET - Retrieve config
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('admin_id');

    if (!adminId) {
      return NextResponse.json(
        { error: 'admin_id is required' },
        { status: 400 }
      );
    }

    const config = await prisma.manychatConfig.findUnique({
      where: { adminId },
      select: {
        id: true,
        apiToken: true,
        pageId: true,
        syncEnabled: true,
        webhookSecret: true,
        active: true,
        lastSyncedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!config) {
      return NextResponse.json({ config: null });
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Get config error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve configuration' },
      { status: 500 }
    );
  }
}

// POST - Create or update config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ConfigSchema.parse(body);

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { id: validated.admin_id },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Upsert config
    const config = await prisma.manychatConfig.upsert({
      where: { adminId: validated.admin_id },
      create: {
        adminId: validated.admin_id,
        apiToken: validated.apiToken,
        pageId: validated.pageId || null,
        syncEnabled: validated.syncEnabled,
        webhookSecret: validated.webhookSecret || null,
        active: true,
      },
      update: {
        apiToken: validated.apiToken,
        pageId: validated.pageId || null,
        syncEnabled: validated.syncEnabled,
        webhookSecret: validated.webhookSecret || null,
        active: true,
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        active: config.active,
        syncEnabled: config.syncEnabled,
      },
    });
  } catch (error) {
    console.error('Save config error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid configuration data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

// DELETE - Remove config
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('admin_id');

    if (!adminId) {
      return NextResponse.json(
        { error: 'admin_id is required' },
        { status: 400 }
      );
    }

    await prisma.manychatConfig.delete({
      where: { adminId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete config error:', error);
    return NextResponse.json(
      { error: 'Failed to delete configuration' },
      { status: 500 }
    );
  }
}
