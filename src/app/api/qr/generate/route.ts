import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GenerateQRSchema } from '@/lib/types';
import { generateUniqueCode } from '@/lib/qr';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = GenerateQRSchema.parse(body);

    // Load tool configuration
    const tool = await prisma.tool.findUnique({
      where: { id: validated.tool_id },
    });

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    if (!tool.active) {
      return NextResponse.json(
        { error: 'Tool is not active' },
        { status: 400 }
      );
    }

    if (tool.type !== 'qr_generator') {
      return NextResponse.json(
        { error: 'Tool is not a QR generator' },
        { status: 400 }
      );
    }

    // Parse tool config
    let toolConfig = null;
    if (tool.config) {
      try {
        toolConfig = JSON.parse(tool.config);
      } catch (error) {
        console.warn('Could not parse tool config, using defaults');
      }
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { manychatId: validated.manychat_user_id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          manychatId: validated.manychat_user_id,
        },
      });
    }

    // Determine QR type (request overrides tool default)
    const qrType = validated.type || toolConfig?.type || 'promotion';

    // Generate unique code with tool's format settings
    const code = generateUniqueCode(
      user.id,
      qrType,
      toolConfig?.qrFormat
    );

    // Calculate expiration (request overrides tool default)
    let expiresAt: Date | null = null;
    const expiresInDays = validated.expires_in_days ?? toolConfig?.expiresInDays;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Merge metadata (tool default + request override)
    let mergedMetadata: any = {};
    if (toolConfig?.defaultMetadata) {
      try {
        mergedMetadata = JSON.parse(toolConfig.defaultMetadata);
      } catch (error) {
        console.warn('Could not parse tool default metadata');
      }
    }
    if (validated.metadata) {
      mergedMetadata = { ...mergedMetadata, ...validated.metadata };
    }

    // Create QR code record
    const qrCode = await prisma.qRCode.create({
      data: {
        userId: user.id,
        toolId: tool.id,
        code,
        type: qrType,
        metadata: Object.keys(mergedMetadata).length > 0
          ? JSON.stringify(mergedMetadata)
          : null,
        expiresAt,
      },
    });

    // Generate public URL for QR code image
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : request.headers.get('origin') || 'http://localhost:3001';
    const qrImageUrl = `${baseUrl}/api/qr/image/${encodeURIComponent(qrCode.code)}`;

    return NextResponse.json({
      success: true,
      qr_id: qrCode.id,
      code: qrCode.code,
      type: qrCode.type,
      qr_image_url: qrImageUrl, // Public URL for Manychat
      expires_at: qrCode.expiresAt?.toISOString(),
      created_at: qrCode.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error generating QR code:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
