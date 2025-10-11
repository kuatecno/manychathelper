import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const qrCodes = await prisma.qRCode.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      qrCodes: qrCodes.map((qr) => ({
        id: qr.id,
        code: qr.code,
        type: qr.type,
        active: qr.active,
        scanned: !!qr.scannedAt,
        scannedAt: qr.scannedAt?.toISOString(),
        scannedBy: qr.scannedBy,
        expiresAt: qr.expiresAt?.toISOString(),
        userName: `${qr.user.firstName || ''} ${qr.user.lastName || ''}`.trim() || 'Unknown',
        userManychatId: qr.user.manychatId,
        metadata: qr.metadata ? JSON.parse(qr.metadata) : null,
        createdAt: qr.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching QR codes:', error);
    return NextResponse.json({ error: 'Failed to fetch QR codes' }, { status: 500 });
  }
}
