import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createManychatClient } from '@/lib/manychat-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json(
        { error: 'Missing adminId parameter' },
        { status: 400 }
      );
    }

    const prisma = new PrismaClient();

    // Get admin with Manychat config
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      include: {
        manychatConfig: true,
      },
    });

    if (!admin || !admin.manychatConfig) {
      await prisma.$disconnect();
      return NextResponse.json(
        { error: 'Admin not found or Manychat not configured' },
        { status: 404 }
      );
    }

    // Get custom fields from Manychat
    const manychat = createManychatClient(admin.manychatConfig.apiToken);
    const response = await manychat.getCustomFields();

    await prisma.$disconnect();

    return NextResponse.json({
      customFields: response.data || [],
    });
  } catch (error: any) {
    console.error('[Get Custom Fields Error]', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch custom fields',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
