import { NextRequest, NextResponse } from 'next/server';
import { generateQRCodeBuffer } from '@/lib/qr';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Load QR appearance settings from database
    let appearanceSettings = null;
    try {
      const appearanceSetting = await prisma.settings.findUnique({
        where: { key: 'qr_appearance' },
      });
      if (appearanceSetting) {
        appearanceSettings = JSON.parse(appearanceSetting.value);
      }
    } catch (error) {
      console.warn('Could not load appearance settings, using defaults');
    }

    // Generate QR code as PNG buffer with settings
    const qrBuffer = await generateQRCodeBuffer(code, appearanceSettings);

    // Return image with proper headers
    return new NextResponse(qrBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating QR image:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR image' },
      { status: 500 }
    );
  }
}
