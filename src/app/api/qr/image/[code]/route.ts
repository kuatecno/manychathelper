import { NextRequest, NextResponse } from 'next/server';
import { generateQRCodeBuffer } from '@/lib/qr';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Generate QR code as PNG buffer
    const qrBuffer = await generateQRCodeBuffer(code);

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
