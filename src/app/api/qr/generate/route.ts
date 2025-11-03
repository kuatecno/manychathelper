import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GenerateQRSchema } from '@/lib/types';
import { generateUniqueCode, resolveQRCodeFormat } from '@/lib/qr';
import { createManychatClient } from '@/lib/manychat-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = GenerateQRSchema.parse(body);

    // Load tool configuration and admin info
    const tool = await prisma.tool.findUnique({
      where: { id: validated.tool_id },
      include: {
        admin: {
          include: {
            manychatConfig: true,
          },
        },
      },
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

    // Generate code - use dynamic format if configured, otherwise use legacy format
    let code: string;

    if (toolConfig?.qrCodeFormat) {
      // Use new dynamic format system with Manychat data
      try {
        let manychatSubscriber;
        let tags: Array<{ manychatTagId: string; name: string }> = [];
        let customFields: Array<{ manychatFieldId: string; name: string; value?: any }> = [];

        // Check if subscriber_data was provided directly in the request
        if (validated.subscriber_data) {
          // Use subscriber data from request (from {{subscriber_data|to_json:true}})
          manychatSubscriber = validated.subscriber_data;

          // Extract tags from subscriber if present
          if (manychatSubscriber.tags) {
            tags = manychatSubscriber.tags.map((tag: any) => ({
              manychatTagId: String(tag.id),
              name: tag.name,
            }));
          }

          // Extract custom fields from subscriber if present
          if (manychatSubscriber.custom_fields) {
            customFields = manychatSubscriber.custom_fields.map((field: any) => ({
              manychatFieldId: String(field.id),
              name: field.name,
              value: field.value,
            }));
          }
        } else if (tool.admin.manychatConfig?.apiToken) {
          // Fallback: Fetch Manychat data if API token is available
          const manychatClient = createManychatClient(tool.admin.manychatConfig.apiToken);

          // Get subscriber info
          try {
            const subscriberResponse = await manychatClient.getSubscriberInfo(
              Number(validated.manychat_user_id)
            );
            manychatSubscriber = subscriberResponse.data;

            // Extract tags from subscriber if present
            if (manychatSubscriber.tags) {
              tags = manychatSubscriber.tags.map(tag => ({
                manychatTagId: String(tag.id),
                name: tag.name,
              }));
            }

            // Extract custom fields from subscriber if present
            if (manychatSubscriber.custom_fields) {
              customFields = manychatSubscriber.custom_fields.map(field => ({
                manychatFieldId: String(field.id),
                name: field.name,
                value: field.value,
              }));
            }
          } catch (manychatError) {
            console.warn('Failed to fetch Manychat subscriber data:', manychatError);
            // Continue with empty data
          }
        }

        // Resolve the dynamic format pattern
        code = resolveQRCodeFormat(toolConfig.qrCodeFormat, {
          manychatSubscriber,
          tags,
          customFields,
        });

        // If resolution resulted in empty code, use fallback
        if (!code || code.trim() === '') {
          code = generateUniqueCode(user.id, qrType, toolConfig?.qrFormat);
        }
      } catch (error) {
        console.error('Error resolving dynamic QR format:', error);
        // Fallback to legacy format
        code = generateUniqueCode(user.id, qrType, toolConfig?.qrFormat);
      }
    } else {
      // Use legacy format system
      code = generateUniqueCode(user.id, qrType, toolConfig?.qrFormat);
    }

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

    // Generate public URL for QR code image with admin username
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : request.headers.get('origin') || 'http://localhost:3001';
    const qrImageUrl = `${baseUrl}/api/qr/${tool.admin.username}/${encodeURIComponent(qrCode.code)}`;

    return NextResponse.json({
      success: true,
      qr_id: qrCode.id,
      code: qrCode.code,
      type: qrCode.type,
      qr_image_url: qrImageUrl, // Public URL for Manychat with username
      admin_username: tool.admin.username,
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
