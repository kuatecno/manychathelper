import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateFieldSchema = z.object({
  admin_id: z.string(),
  field_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = UpdateFieldSchema.parse(body);

    // Verify the field belongs to this admin
    const field = await prisma.customField.findUnique({
      where: { id: validated.field_id },
      select: { adminId: true },
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

    // Update the custom field
    const updatedField = await prisma.customField.update({
      where: { id: validated.field_id },
      data: {
        name: validated.name,
        description: validated.description || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Custom field updated successfully',
      field: updatedField,
    });
  } catch (error) {
    console.error('Error updating custom field:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update custom field', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
