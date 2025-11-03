import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateToolSchema = z.object({
  adminId: z.string().optional(), // Optional for backward compatibility
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  config: z.string().optional(),
  manychatFlowId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const adminId = searchParams.get('adminId');

    const tools = await prisma.tool.findMany({
      where: {
        ...(type && { type }),
        ...(adminId && { adminId }),
      },
      include: {
        _count: {
          select: {
            bookings: true,
            availabilities: true,
            qrCodes: true,
            conversations: true,
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
        isActive: t.active, // Add isActive for consistency
        bookingsCount: t._count.bookings,
        availabilitiesCount: t._count.availabilities,
        createdAt: t.createdAt.toISOString(),
        _count: {
          bookings: t._count.bookings,
          qrCodes: t._count.qrCodes,
          conversations: t._count.conversations,
        },
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

    // If no adminId provided, find or use demo admin
    let adminId = validated.adminId;
    if (!adminId) {
      const demoAdmin = await prisma.admin.findUnique({
        where: { username: 'demo' },
      });

      if (!demoAdmin) {
        return NextResponse.json(
          { error: 'No admin account found. Please create an admin account first.' },
          { status: 400 }
        );
      }

      adminId = demoAdmin.id;
    }

    const tool = await prisma.tool.create({
      data: {
        ...validated,
        adminId,
      },
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
