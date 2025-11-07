import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  getQRFieldMappings,
  saveQRFieldMappings,
  QR_AVAILABLE_FIELDS,
} from '@/lib/qr-field-mapping';

// Validation schema for field mapping
const fieldMappingSchema = z.object({
  qrField: z.string(),
  manychatFieldId: z.string(),
  manychatFieldName: z.string(),
  enabled: z.boolean(),
  autoCreate: z.boolean().optional(),
});

const qrMappingConfigSchema = z.object({
  mappings: z.array(fieldMappingSchema),
  autoSyncOnScan: z.boolean(),
  autoSyncOnValidation: z.boolean(),
});

/**
 * GET /api/admin/tools/[id]/qr-mapping
 * Get QR field mappings for a tool
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get adminId from header
    const adminId = request.headers.get('x-admin-id');

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const { id: toolId } = await params;

    // Verify tool belongs to admin
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
    });

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    if (tool.adminId !== admin.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get mappings
    const mappingConfig = await getQRFieldMappings(toolId);

    return NextResponse.json({
      success: true,
      mappings: mappingConfig || {
        toolId,
        mappings: [],
        autoSyncOnScan: false,
        autoSyncOnValidation: true,
      },
      availableFields: QR_AVAILABLE_FIELDS,
    });
  } catch (error) {
    console.error('Error fetching QR mappings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tools/[id]/qr-mapping
 * Save QR field mappings for a tool
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get adminId from header
    const adminId = request.headers.get('x-admin-id');

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const { id: toolId } = await params;

    // Verify tool belongs to admin
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
    });

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    if (tool.adminId !== admin.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify tool is a QR generator
    if (tool.type !== 'qr_generator') {
      return NextResponse.json(
        { error: 'Tool is not a QR generator' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = qrMappingConfigSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const mappingConfig = validationResult.data;

    // Save mappings
    await saveQRFieldMappings(toolId, mappingConfig);

    return NextResponse.json({
      success: true,
      message: 'QR field mappings saved successfully',
    });
  } catch (error) {
    console.error('Error saving QR mappings:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
