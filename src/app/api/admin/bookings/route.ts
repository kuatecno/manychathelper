import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        helper: true,
      },
      orderBy: { startTime: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        status: b.status,
        notes: b.notes,
        userName: `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim() || 'Unknown',
        userEmail: b.user.manychatId,
        helperName: b.helper.name,
        createdAt: b.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
