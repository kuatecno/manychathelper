import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GenerateQRSchema } from '@/lib/types';
import { generateQRCodeDataURL, generateUniqueCode } from '@/lib/qr';

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

    // Generate unique code
    const code = generateUniqueCode(user.id, validated.type);

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

    // Generate QR code image as data URL
    const qrDataURL = await generateQRCodeDataURL(code);

    return NextResponse.json({
      success: true,
      qr_id: qrCode.id,
      code: qrCode.code,
      type: qrCode.type,
      qr_image: qrDataURL, // Base64 data URL for Manychat
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
