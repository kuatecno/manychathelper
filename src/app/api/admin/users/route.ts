import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Enhanced Users API with Filtering, Pagination, and Field Selection
 *
 * GET /api/admin/users?limit=50&offset=0&createdAfter=2025-01-01&hasTag=vip&search=john
 *
 * Query Parameters:
 * - limit: Number of records to return (default: 50, max: 1000)
 * - offset: Number of records to skip (default: 0)
 * - cursor: Cursor-based pagination (user ID)
 * - createdAfter: Filter by creation date (ISO format)
 * - createdBefore: Filter by creation date (ISO format)
 * - updatedAfter: Filter by last update date (ISO format)
 * - hasTag: Filter by tag name
 * - customField[name]: Filter by custom field value
 * - optedIn: Filter by opt-in platform (messenger, instagram, whatsapp, telegram)
 * - search: Search in firstName, lastName, igUsername, email
 * - sortBy: Sort field (createdAt, updatedAt, firstName, lastName) (default: createdAt)
 * - sortOrder: Sort order (asc, desc) (default: desc)
 * - includeBookings: Include booking details (default: false)
 * - includeQRCodes: Include QR code details (default: false)
 * - includeInteractions: Include interaction history (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50'),
      1000
    );
    const offset = parseInt(searchParams.get('offset') || '0');
    const cursor = searchParams.get('cursor') || undefined;

    // Filters
    const createdAfter = searchParams.get('createdAfter');
    const createdBefore = searchParams.get('createdBefore');
    const updatedAfter = searchParams.get('updatedAfter');
    const hasTag = searchParams.get('hasTag');
    const optedIn = searchParams.get('optedIn');
    const search = searchParams.get('search');
    const exportConsentOnly = searchParams.get('exportConsentOnly') === 'true';

    // Custom field filters (customField[fieldName]=value)
    const customFieldFilters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      const match = key.match(/^customField\[(.+)\]$/);
      if (match) {
        customFieldFilters[match[1]] = value;
      }
    });

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Include options
    const includeBookings = searchParams.get('includeBookings') === 'true';
    const includeQRCodes = searchParams.get('includeQRCodes') === 'true';
    const includeInteractions = searchParams.get('includeInteractions') === 'true';

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    // Date filters
    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) where.createdAt.gte = new Date(createdAfter);
      if (createdBefore) where.createdAt.lte = new Date(createdBefore);
    }

    if (updatedAfter) {
      where.updatedAt = { gte: new Date(updatedAfter) };
    }

    // Export consent filter
    if (exportConsentOnly) {
      where.exportConsentGiven = true;
    }

    // Tag filter
    if (hasTag) {
      where.contactTags = {
        some: {
          tag: {
            name: {
              equals: hasTag,
              mode: 'insensitive',
            },
          },
        },
      };
    }

    // Opt-in filter
    if (optedIn) {
      switch (optedIn.toLowerCase()) {
        case 'messenger':
          where.optedInMessenger = true;
          break;
        case 'instagram':
          where.optedInInstagram = true;
          break;
        case 'whatsapp':
          where.optedInWhatsapp = true;
          break;
        case 'telegram':
          where.optedInTelegram = true;
          break;
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { igUsername: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Custom field filters
    if (Object.keys(customFieldFilters).length > 0) {
      where.customFieldValues = {
        some: {
          OR: Object.entries(customFieldFilters).map(([fieldName, value]) => ({
            field: {
              name: {
                equals: fieldName,
                mode: 'insensitive',
              },
            },
            value: {
              contains: value,
              mode: 'insensitive',
            },
          })),
        },
      };
    }

    // Build orderBy
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    if (sortBy === 'firstName' || sortBy === 'lastName' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
      orderBy[sortBy] = sortOrder as 'asc' | 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Fetch users
    const users = await prisma.user.findMany({
      where,
      take: limit,
      skip: cursor ? undefined : offset,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy,
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
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customFieldValues: {
          include: {
            field: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        bookings: includeBookings
          ? {
              orderBy: { createdAt: 'desc' },
              take: 10,
            }
          : false,
        qrCodes: includeQRCodes
          ? {
              orderBy: { createdAt: 'desc' },
              take: 10,
            }
          : false,
        interactionHistory: includeInteractions
          ? {
              orderBy: { date: 'desc' },
              take: 30,
            }
          : false,
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        manychatId: u.manychatId,
        instagramId: u.instagramId,
        igUsername: u.igUsername,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        whatsappPhone: u.whatsappPhone,
        profilePic: u.profilePic,
        gender: u.gender,
        locale: u.locale,
        timezone: u.timezone,
        subscribedAt: u.subscribedAt?.toISOString() || null,
        optedInMessenger: u.optedInMessenger,
        optedInInstagram: u.optedInInstagram,
        optedInWhatsapp: u.optedInWhatsapp,
        optedInTelegram: u.optedInTelegram,
        exportConsentGiven: u.exportConsentGiven,
        exportConsentAt: u.exportConsentAt?.toISOString() || null,
        lastSyncedAt: u.lastSyncedAt?.toISOString() || null,
        bookingsCount: u._count.bookings,
        qrCodesCount: u._count.qrCodes,
        conversationsCount: u._count.conversations,
        tags: u.contactTags.map((ct) => ({
          id: ct.tag.id,
          name: ct.tag.name,
          appliedAt: ct.appliedAt.toISOString(),
        })),
        customFields: Object.fromEntries(
          u.customFieldValues.map((cfv) => [cfv.field.name, cfv.value])
        ),
        bookings: includeBookings ? (u.bookings as any[]) : undefined,
        qrCodes: includeQRCodes ? (u.qrCodes as any[]) : undefined,
        interactionHistory: includeInteractions ? (u.interactionHistory as any[]) : undefined,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + users.length < totalCount,
        nextCursor: users.length === limit ? users[users.length - 1].id : null,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
