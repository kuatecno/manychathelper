import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ToolAvailabilitySchema } from '@/lib/types';

// GET /api/bookings/availability?tool_id=xxx&date=2025-10-08T00:00:00Z
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const toolId = searchParams.get('tool_id');
    const dateStr = searchParams.get('date');

    if (!toolId || !dateStr) {
      return NextResponse.json(
        { error: 'tool_id and date are required' },
        { status: 400 }
      );
    }

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    // Get tool's availability for this day
    const availabilities = await prisma.availability.findMany({
      where: {
        toolId,
        dayOfWeek,
        active: true,
      },
    });

    if (availabilities.length === 0) {
      return NextResponse.json({
        available_slots: [],
        message: 'No availability for this day',
      });
    }

    // Get existing bookings for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await prisma.booking.findMany({
      where: {
        toolId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['pending', 'confirmed'],
        },
      },
    });

    // Generate time slots
    const slots: string[] = [];

    for (const availability of availabilities) {
      const [startHour, startMinute] = availability.startTime.split(':').map(Number);
      const [endHour, endMinute] = availability.endTime.split(':').map(Number);

      let currentTime = new Date(date);
      currentTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(endHour, endMinute, 0, 0);

      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + availability.slotDuration * 60000);

        // Check if this slot is already booked
        const isBooked = existingBookings.some(booking => {
          return (
            (currentTime >= booking.startTime && currentTime < booking.endTime) ||
            (slotEnd > booking.startTime && slotEnd <= booking.endTime)
          );
        });

        if (!isBooked) {
          slots.push(currentTime.toISOString());
        }

        currentTime = slotEnd;
      }
    }

    return NextResponse.json({
      tool_id: toolId,
      date: dateStr,
      available_slots: slots,
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
