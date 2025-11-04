import { NextRequest, NextResponse } from 'next/server';
import { createManychatClient } from '@/lib/manychat-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, fieldName, fieldType = 'number', description } = body;

    if (!adminId || !fieldName) {
      return NextResponse.json(
        { error: 'Missing required fields: adminId, fieldName' },
        { status: 400 }
      );
    }

    // Get admin from database to get API key
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      include: {
        manychatConfig: true,
      },
    });

    if (!admin || !admin.manychatConfig) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: 'Admin not found or Manychat API key not configured' },
        { status: 404 }
      );
    }

    // Create Manychat client
    const manychat = createManychatClient(admin.manychatConfig.apiToken);

    // Create custom field
    const result = await manychat.createCustomField(
      fieldName,
      fieldType,
      description || `Flowkick tracker field: ${fieldName}`
    );

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      field: result,
      message: `Custom field "${fieldName}" created successfully`,
    });
  } catch (error: any) {
    console.error('[Custom Field Create Error]', error);
    return NextResponse.json(
      {
        error: 'Failed to create custom field',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
