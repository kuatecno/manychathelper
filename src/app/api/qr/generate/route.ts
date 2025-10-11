import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GenerateQRSchema } from '@/lib/types';
import { generateUniqueCode } from '@/lib/qr';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = GenerateQRSchema.parse(body);

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

    // Load QR format settings from database
    let formatSettings = null;
    try {
      const formatSetting = await prisma.settings.findUnique({
        where: { key: 'qr_format' },
      });
      if (formatSetting) {
        formatSettings = JSON.parse(formatSetting.value);
      }
    } catch (error) {
      console.warn('Could not load format settings, using defaults');
    }

    // Generate unique code with settings
    const code = generateUniqueCode(user.id, validated.type, formatSettings);

    // Calculate expiration
    let expiresAt: Date | null = null;
    if (validated.expires_in_days) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validated.expires_in_days);
    }

    // Create QR code record
    const qrCode = await prisma.qRCode.create({
      data: {
        userId: user.id,
        code,
        type: validated.type,
        metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
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
