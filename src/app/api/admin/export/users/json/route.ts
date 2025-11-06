import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * JSON Export Endpoint for Users
 *
 * GET /api/admin/export/users/json?createdAfter=2025-01-01&includeBookings=true&includeQRCodes=true
 *
 * Exports user data to JSON format with comprehensive related data
 */
export async function GET(request: NextRequest) {
  try {
    const adminId = request.headers.get('x-admin-id') || 'default-admin';
    const searchParams = request.nextUrl.searchParams;

    // Filters
    const createdAfter = searchParams.get('createdAfter');
    const createdBefore = searchParams.get('createdBefore');
    const updatedAfter = searchParams.get('updatedAfter');
    const hasTag = searchParams.get('hasTag');
    const optedIn = searchParams.get('optedIn');
    const search = searchParams.get('search');
    const exportConsentOnly = searchParams.get('exportConsentOnly') === 'true';

    // Include options
    const includeBookings = searchParams.get('includeBookings') === 'true';
    const includeQRCodes = searchParams.get('includeQRCodes') === 'true';
    const includeInteractions = searchParams.get('includeInteractions') === 'true';
    const includeConversations = searchParams.get('includeConversations') === 'true';

    // Build where clause
    const where: any = {};

    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) where.createdAt.gte = new Date(createdAfter);
      if (createdBefore) where.createdAt.lte = new Date(createdBefore);
    }

    if (updatedAfter) {
      where.updatedAt = { gte: new Date(updatedAfter) };
    }

    if (exportConsentOnly) {
      where.exportConsentGiven = true;
    }

    if (hasTag) {
      where.contactTags = {
        some: {
          tag: {
            name: { equals: hasTag, mode: 'insensitive' },
          },
        },
      };
    }

    if (optedIn) {
      const field = `optedIn${optedIn.charAt(0).toUpperCase() + optedIn.slice(1)}`;
      where[field] = true;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { igUsername: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            bookings: true,
            qrCodes: true,
            conversations: true,
            interactionHistory: true,
          },
        },
        contactTags: {
          include: {
            tag: true,
          },
        },
        customFieldValues: {
          include: {
            field: true,
          },
        },
        bookings: includeBookings
          ? {
              include: {
                tool: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            }
          : false,
        qrCodes: includeQRCodes
          ? {
              include: {
                tool: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            }
          : false,
        interactionHistory: includeInteractions
          ? {
              orderBy: { date: 'desc' },
            }
          : false,
        conversations: includeConversations
          ? {
              include: {
                messages: {
                  orderBy: { createdAt: 'asc' },
                  take: 50, // Limit messages per conversation
                },
                tool: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            }
          : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        recordCount: users.length,
        filters: {
          createdAfter,
          createdBefore,
          updatedAfter,
          hasTag,
          optedIn,
          search,
          exportConsentOnly,
        },
        includes: {
          bookings: includeBookings,
          qrCodes: includeQRCodes,
          interactions: includeInteractions,
          conversations: includeConversations,
        },
      },
      users: users.map((user) => ({
        id: user.id,
        manychatId: user.manychatId,
        instagram: {
          id: user.instagramId,
          username: user.igUsername,
        },
        profile: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          whatsappPhone: user.whatsappPhone,
          gender: user.gender,
          locale: user.locale,
          timezone: user.timezone,
          profilePic: user.profilePic,
        },
        optIns: {
          messenger: user.optedInMessenger,
          instagram: user.optedInInstagram,
          whatsapp: user.optedInWhatsapp,
          telegram: user.optedInTelegram,
        },
        exportConsent: {
          given: user.exportConsentGiven,
          at: user.exportConsentAt?.toISOString(),
        },
        tags: user.contactTags.map((ct) => ({
          id: ct.tag.id,
          name: ct.tag.name,
          manychatTagId: ct.tag.manychatTagId,
          appliedAt: ct.appliedAt.toISOString(),
        })),
        customFields: Object.fromEntries(
          user.customFieldValues.map((cfv) => [
            cfv.field.name,
            {
              value: cfv.value,
              type: cfv.field.type,
              fieldId: cfv.field.manychatFieldId,
            },
          ])
        ),
        stats: {
          bookingsCount: user._count.bookings,
          qrCodesCount: user._count.qrCodes,
          conversationsCount: user._count.conversations,
          interactionHistoryCount: user._count.interactionHistory,
        },
        bookings: includeBookings
          ? (user.bookings as any[]).map((b) => ({
              id: b.id,
              startTime: b.startTime.toISOString(),
              endTime: b.endTime.toISOString(),
              status: b.status,
              notes: b.notes,
              tool: b.tool,
              createdAt: b.createdAt.toISOString(),
            }))
          : undefined,
        qrCodes: includeQRCodes
          ? (user.qrCodes as any[]).map((qr) => ({
              id: qr.id,
              code: qr.code,
              type: qr.type,
              metadata: qr.metadata ? JSON.parse(qr.metadata) : null,
              active: qr.active,
              expiresAt: qr.expiresAt?.toISOString(),
              scannedAt: qr.scannedAt?.toISOString(),
              scannedBy: qr.scannedBy,
              tool: qr.tool,
              createdAt: qr.createdAt.toISOString(),
            }))
          : undefined,
        interactionHistory: includeInteractions
          ? (user.interactionHistory as any[]).map((ih) => ({
              date: ih.date.toISOString(),
              messagesCount: ih.messagesCount,
              commentsCount: ih.commentsCount,
              storiesCount: ih.storiesCount,
              totalCount: ih.totalCount,
            }))
          : undefined,
        conversations: includeConversations
          ? (user.conversations as any[]).map((conv) => ({
              id: conv.id,
              title: conv.title,
              active: conv.active,
              tool: conv.tool,
              messages: conv.messages.map((msg: any) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                tokens: msg.tokens,
                createdAt: msg.createdAt.toISOString(),
              })),
              createdAt: conv.createdAt.toISOString(),
              updatedAt: conv.updatedAt.toISOString(),
            }))
          : undefined,
        timestamps: {
          subscribedAt: user.subscribedAt?.toISOString(),
          lastSyncedAt: user.lastSyncedAt?.toISOString(),
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      })),
    };

    // Serialize to JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    const fileHash = crypto.createHash('sha256').update(jsonString).digest('hex');
    const fileSizeBytes = Buffer.byteLength(jsonString, 'utf8');

    // Log export
    await prisma.dataExport.create({
      data: {
        adminId,
        exportType: 'json',
        recordType: 'users',
        recordCount: users.length,
        fields: JSON.stringify([
          'profile',
          'optIns',
          'tags',
          'customFields',
          'stats',
          ...(includeBookings ? ['bookings'] : []),
          ...(includeQRCodes ? ['qrCodes'] : []),
          ...(includeInteractions ? ['interactionHistory'] : []),
          ...(includeConversations ? ['conversations'] : []),
        ]),
        filters: JSON.stringify({
          createdAfter,
          createdBefore,
          updatedAfter,
          hasTag,
          optedIn,
          search,
          exportConsentOnly,
        }),
        dateRangeStart: createdAfter ? new Date(createdAfter) : null,
        dateRangeEnd: createdBefore ? new Date(createdBefore) : null,
        fileHash,
        fileSizeBytes,
        includesWithoutConsent: exportConsentOnly ? false : users.some((u) => !u.exportConsentGiven),
        initiatedBy: adminId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      },
    });

    // Return JSON file
    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.json"`,
        'Content-Length': fileSizeBytes.toString(),
        'X-Export-Count': users.length.toString(),
        'X-File-Hash': fileHash,
      },
    });
  } catch (error) {
    console.error('JSON export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export users to JSON',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
