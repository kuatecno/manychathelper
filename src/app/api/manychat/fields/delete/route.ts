import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const DeleteFieldSchema = z.object({
  admin_id: z.string(),
  field_id: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = DeleteFieldSchema.parse(body);

    // Verify the field belongs to this admin
    const field = await prisma.customField.findUnique({
      where: { id: validated.field_id },
      select: { adminId: true, name: true },
    });

    if (!field) {
      return NextResponse.json(
        { error: 'Custom field not found' },
        { status: 404 }
      );
    }

    if (field.adminId !== validated.admin_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete the custom field
    await prisma.customField.delete({
      where: { id: validated.field_id },
    });

    return NextResponse.json({
      success: true,
      message: 'Custom field deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting custom field:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete custom field', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
