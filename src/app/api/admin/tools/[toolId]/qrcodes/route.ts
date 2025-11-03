import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await params;
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    // Verify the tool belongs to this admin
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
      select: { adminId: true },
    });

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    if (tool.adminId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all QR codes for this tool
    const qrCodes = await prisma.qRCode.findMany({
      where: { toolId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        type: true,
        metadata: true,
        expiresAt: true,
        scannedAt: true,
        scannedBy: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      qrCodes: qrCodes.map((qr) => ({
        id: qr.id,
        code: qr.code,
        type: qr.type,
        metadata: qr.metadata ? JSON.parse(qr.metadata) : null,
        expiresAt: qr.expiresAt?.toISOString() || null,
        scannedAt: qr.scannedAt?.toISOString() || null,
        scannedBy: qr.scannedBy,
        active: qr.active,
        createdAt: qr.createdAt.toISOString(),
        usageCount: qr.scannedAt ? 1 : 0, // Simple count based on whether it's been scanned
        maxUses: null, // Not tracked in current schema
      })),
    });
  } catch (error) {
    console.error('Error fetching QR codes for tool:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QR codes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
