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

    // Fetch all bookings for this tool
    const bookings = await prisma.booking.findMany({
      where: { toolId },
      orderBy: { startTime: 'desc' },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        notes: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        status: b.status,
        notes: b.notes,
        createdAt: b.createdAt.toISOString(),
        user: {
          name: `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim() || 'Unknown',
          email: b.user.email || 'No email',
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching bookings for tool:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
