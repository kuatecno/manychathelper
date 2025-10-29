import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createManychatClient } from '@/lib/manychat-client';
import { z } from 'zod';

const CreateFieldSchema = z.object({
  admin_id: z.string(),
  name: z.string(),
  type: z.enum(['text', 'number', 'date', 'datetime', 'boolean', 'array']),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateFieldSchema.parse(body);

    // Get admin and Manychat config
    const admin = await prisma.admin.findUnique({
      where: { id: validated.admin_id },
      include: { manychatConfig: true },
    });

    if (!admin || !admin.manychatConfig) {
      return NextResponse.json(
        { error: 'Admin or Manychat config not found' },
        { status: 404 }
      );
    }

    // Create Manychat client
    const manychatClient = createManychatClient(admin.manychatConfig.apiToken);

    // Create custom field via Manychat API
    const result = await manychatClient.createCustomField(
      validated.name,
      validated.type,
      validated.description
    );

    // Save to database
    const customField = await prisma.customField.create({
      data: {
        adminId: validated.admin_id,
        manychatFieldId: String(result.data.id),
        name: result.data.name,
        type: result.data.type,
        description: validated.description || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Custom field created successfully',
      field: {
        id: customField.id,
        manychatFieldId: customField.manychatFieldId,
        name: customField.name,
        type: customField.type,
      },
    });
  } catch (error) {
    console.error('Error creating custom field:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create custom field', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
