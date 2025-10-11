import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateHelperSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = UpdateHelperSchema.parse(body);

    const helper = await prisma.helper.update({
      where: { id },
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
    console.error('Error updating helper:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update helper' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.helper.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting helper:', error);
    return NextResponse.json({ error: 'Failed to delete helper' }, { status: 500 });
  }
}
