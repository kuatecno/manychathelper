import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const DeleteTagSchema = z.object({
  admin_id: z.string(),
  tag_id: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = DeleteTagSchema.parse(body);

    // Verify the tag belongs to this admin
    const tag = await prisma.tag.findUnique({
      where: { id: validated.tag_id },
      select: { adminId: true, name: true },
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

    // Delete the tag
    await prisma.tag.delete({
      where: { id: validated.tag_id },
    });

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting tag:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete tag', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
