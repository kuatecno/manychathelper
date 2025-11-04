import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ qrId: string }> }
) {
  try {
    const { qrId } = await params;
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID required' }, { status: 401 });
    }

    // Verify the QR code belongs to a tool owned by this admin
    const qrCode = await prisma.qRCode.findUnique({
      where: { id: qrId },
      include: {
        tool: {
          select: { adminId: true },
        },
      },
    });

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }

    if (qrCode.tool.adminId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the QR code
    await prisma.qRCode.delete({
      where: { id: qrId },
    });

    return NextResponse.json({ success: true, message: 'QR code deleted successfully' });
  } catch (error) {
    console.error('Error deleting QR code:', error);
    return NextResponse.json(
      { error: 'Failed to delete QR code' },
      { status: 500 }
    );
  }
}
