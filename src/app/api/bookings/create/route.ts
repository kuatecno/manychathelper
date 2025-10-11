import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateBookingSchema } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateBookingSchema.parse(body);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { manychatId: validated.manychat_user_id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          manychatId: validated.manychat_user_id,
        },
      });
    }

    // Verify tool exists
    const tool = await prisma.tool.findUnique({
      where: { id: validated.tool_id },
    });

    if (!tool || !tool.active) {
      return NextResponse.json(
        { error: 'Tool not found or inactive' },
        { status: 404 }
      );
    }

    const startTime = new Date(validated.start_time);
    const endTime = new Date(startTime.getTime() + validated.duration * 60000);

    // Check for conflicts
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        toolId: validated.tool_id,
        status: {
          in: ['pending', 'confirmed'],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: 'Time slot not available' },
        { status: 409 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        toolId: validated.tool_id,
        startTime,
        endTime,
        notes: validated.notes,
      },
      include: {
        tool: true,
      },
    });

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      tool_name: booking.tool.name,
      start_time: booking.startTime.toISOString(),
      end_time: booking.endTime.toISOString(),
      status: booking.status,
    });
  } catch (error) {
    console.error('Error creating booking:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
