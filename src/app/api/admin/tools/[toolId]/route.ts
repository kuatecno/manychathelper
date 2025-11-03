import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateToolSchema = z.object({
  adminId: z.string().optional(),
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  active: z.boolean().optional(),
  isActive: z.boolean().optional(),
  config: z.string().optional().nullable(),
  manychatFlowId: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId: id } = await params;
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    const tool = await prisma.tool.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
            qrCodes: true,
            conversations: true,
          },
        },
      },
    });

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Verify ownership if adminId is provided
    if (adminId && tool.adminId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      id: tool.id,
      name: tool.name,
      type: tool.type,
      description: tool.description,
      active: tool.active,
      isActive: tool.active,
      config: tool.config,
      manychatFlowId: tool.manychatFlowId,
      createdAt: tool.createdAt.toISOString(),
      updatedAt: tool.updatedAt.toISOString(),
      _count: {
        bookings: tool._count.bookings,
        qrCodes: tool._count.qrCodes,
        conversations: tool._count.conversations,
      },
    });
  } catch (error) {
    console.error('Error fetching tool:', error);
    return NextResponse.json({ error: 'Failed to fetch tool' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId: id } = await params;
    const body = await request.json();
    const validated = UpdateToolSchema.parse(body);

    // Verify ownership if adminId is provided
    if (validated.adminId) {
      const existingTool = await prisma.tool.findUnique({
        where: { id },
        select: { adminId: true },
      });

      if (!existingTool) {
        return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
      }

      if (existingTool.adminId !== validated.adminId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Map isActive to active if provided
    const updateData: any = { ...validated };
    if (validated.isActive !== undefined) {
      updateData.active = validated.isActive;
      delete updateData.isActive;
    }
    delete updateData.adminId; // Don't update adminId

    const tool = await prisma.tool.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: tool.id,
      name: tool.name,
      type: tool.type,
      description: tool.description,
      active: tool.active,
      isActive: tool.active,
      createdAt: tool.createdAt.toISOString(),
      updatedAt: tool.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating tool:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId: id } = await params;

    await prisma.tool.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tool:', error);
    return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 });
  }
}
