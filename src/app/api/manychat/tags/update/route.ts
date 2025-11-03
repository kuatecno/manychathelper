import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateTagSchema = z.object({
  admin_id: z.string(),
  tag_id: z.string(),
  name: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = UpdateTagSchema.parse(body);

    // Verify the tag belongs to this admin
    const tag = await prisma.tag.findUnique({
      where: { id: validated.tag_id },
      select: { adminId: true },
    });

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      );
    }

    if (tag.adminId !== validated.admin_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Update the tag
    const updatedTag = await prisma.tag.update({
      where: { id: validated.tag_id },
      data: { name: validated.name },
    });

    return NextResponse.json({
      success: true,
      message: 'Tag updated successfully',
      tag: updatedTag,
    });
  } catch (error) {
    console.error('Error updating tag:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update tag', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
