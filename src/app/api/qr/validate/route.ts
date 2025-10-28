import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ValidateQRSchema = z.object({
  code: z.string(),
  scanned_by: z.string().optional(),
  apply_actions: z.boolean().optional(), // If true, apply tags and custom fields
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ValidateQRSchema.parse(body);

    // Find QR code
    const qrCode = await prisma.qRCode.findUnique({
      where: { code: validated.code },
      include: {
        user: true,
      },
    });

    if (!qrCode) {
      return NextResponse.json(
        {
          valid: false,
          error: 'QR code not found',
        },
        { status: 404 }
      );
    }

    // Check if already scanned
    if (qrCode.scannedAt) {
      return NextResponse.json({
        valid: false,
        error: 'QR code already used',
        scanned_at: qrCode.scannedAt.toISOString(),
        scanned_by: qrCode.scannedBy,
      });
    }

    // Check if expired
    if (qrCode.expiresAt && qrCode.expiresAt < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'QR code expired',
        expired_at: qrCode.expiresAt.toISOString(),
      });
    }

    // Check if inactive
    if (!qrCode.active) {
      return NextResponse.json({
        valid: false,
        error: 'QR code inactive',
      });
    }

    // Parse metadata to check for actions
    let metadata: any = null;
    const actionsApplied: any = {
      tags: [],
      custom_fields: [],
    };

    if (qrCode.metadata) {
      try {
        metadata = JSON.parse(qrCode.metadata);
      } catch (e) {
        console.error('Failed to parse metadata:', e);
      }
    }

    // Apply actions if requested and metadata contains action directives
    if (validated.apply_actions && metadata) {
      // Apply tags if specified (metadata can contain tag IDs to apply)
      if (metadata.apply_tags && Array.isArray(metadata.apply_tags)) {
        // Note: This would require Manychat API call to apply tags
        // For now, we log what would be applied
        actionsApplied.tags = metadata.apply_tags;
      }

      // Log custom field updates that should be made
      if (metadata.update_fields && typeof metadata.update_fields === 'object') {
        actionsApplied.custom_fields = metadata.update_fields;
      }
    }

    // Mark as scanned
    const updatedQR = await prisma.qRCode.update({
      where: { id: qrCode.id },
      data: {
        scannedAt: new Date(),
        scannedBy: validated.scanned_by,
      },
    });

    return NextResponse.json({
      valid: true,
      qr_id: updatedQR.id,
      type: updatedQR.type,
      user_id: qrCode.user.manychatId,
      user_name: `${qrCode.user.firstName || ''} ${qrCode.user.lastName || ''}`.trim(),
      metadata: metadata || {},
      scanned_at: updatedQR.scannedAt?.toISOString(),
      actions_to_apply: validated.apply_actions ? actionsApplied : undefined,
    });
  } catch (error) {
    console.error('Error validating QR code:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to validate QR code' },
      { status: 500 }
    );
  }
}

// GET endpoint to check QR code status without marking as scanned
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'code parameter is required' },
        { status: 400 }
      );
    }

    const qrCode = await prisma.qRCode.findUnique({
      where: { code },
      include: {
        user: true,
      },
    });

    if (!qrCode) {
      return NextResponse.json(
        { error: 'QR code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: qrCode.id,
      type: qrCode.type,
      active: qrCode.active,
      scanned: !!qrCode.scannedAt,
      scanned_at: qrCode.scannedAt?.toISOString(),
      expires_at: qrCode.expiresAt?.toISOString(),
      expired: qrCode.expiresAt ? qrCode.expiresAt < new Date() : false,
    });
  } catch (error) {
    console.error('Error checking QR code:', error);
    return NextResponse.json(
      { error: 'Failed to check QR code' },
      { status: 500 }
    );
  }
}
