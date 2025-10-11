import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateToolSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  config: z.string().optional(),
  manychatFlowId: z.string().optional(),
});

export async function GET() {
  try {
    const tools = await prisma.tool.findMany({
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
      tools: tools.map((t) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        description: t.description,
        active: t.active,
        bookingsCount: t._count.bookings,
        availabilitiesCount: t._count.availabilities,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateToolSchema.parse(body);

    const tool = await prisma.tool.create({
      data: validated,
    });

    return NextResponse.json({
      success: true,
      tool: {
        id: tool.id,
        name: tool.name,
        type: tool.type,
        description: tool.description,
        active: tool.active,
      },
    });
  } catch (error) {
    console.error('Error creating tool:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to create tool' }, { status: 500 });
  }
}
