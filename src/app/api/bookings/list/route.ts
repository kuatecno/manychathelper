import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/bookings/list?manychat_user_id=xxx
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const manychatUserId = searchParams.get('manychat_user_id');

    if (!manychatUserId) {
      return NextResponse.json(
        { error: 'manychat_user_id is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { manychatId: manychatUserId },
    });

    if (!user) {
      return NextResponse.json({
        bookings: [],
        message: 'No user found',
      });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        status: {
          in: ['pending', 'confirmed'],
        },
      },
      include: {
        tool: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json({
      bookings: bookings.map(b => ({
        id: b.id,
        tool_name: b.tool.name,
        start_time: b.startTime.toISOString(),
        end_time: b.endTime.toISOString(),
        status: b.status,
        notes: b.notes,
      })),
    });
  } catch (error) {
    console.error('Error listing bookings:', error);
    return NextResponse.json(
      { error: 'Failed to list bookings' },
      { status: 500 }
    );
  }
}
