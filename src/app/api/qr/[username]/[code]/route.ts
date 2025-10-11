import { NextRequest, NextResponse } from 'next/server';
import { generateQRCodeBuffer } from '@/lib/qr';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string; code: string }> }
) {
  try {
    const { username, code } = await params;

    // Find QR code and load tool config via admin username
    let appearanceSettings = null;
    try {
      const qrCode = await prisma.qRCode.findUnique({
        where: { code },
        include: {
          tool: {
            include: { admin: true },
          },
        },
      });

      // Verify the username matches the tool's admin
      if (qrCode?.tool?.admin?.username !== username) {
        return NextResponse.json(
          { error: 'Invalid QR code URL' },
          { status: 404 }
        );
      }

      if (qrCode?.tool?.config) {
        const toolConfig = JSON.parse(qrCode.tool.config);
        appearanceSettings = toolConfig.qrAppearance;
      }
    } catch (error) {
      console.warn('Could not load QR appearance from tool config, using defaults');
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
