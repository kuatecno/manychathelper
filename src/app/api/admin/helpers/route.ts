import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateHelperSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export async function GET() {
  try {
    const helpers = await prisma.helper.findMany({
      include: {
        _count: {
          select: {
            bookings: true,
            availabilities: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      helpers: helpers.map((h) => ({
        id: h.id,
        name: h.name,
        email: h.email,
        phone: h.phone,
        active: h.active,
        bookingsCount: h._count.bookings,
        availabilitiesCount: h._count.availabilities,
        createdAt: h.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching helpers:', error);
    return NextResponse.json({ error: 'Failed to fetch helpers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateHelperSchema.parse(body);

    const helper = await prisma.helper.create({
      data: validated,
    });

    return NextResponse.json({
      success: true,
      helper: {
        id: helper.id,
        name: helper.name,
        email: helper.email,
        phone: helper.phone,
        active: helper.active,
      },
    });
  } catch (error) {
    console.error('Error creating helper:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to create helper' }, { status: 500 });
  }
}
