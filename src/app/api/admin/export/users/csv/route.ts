import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stringify } from 'csv-stringify/sync';
import crypto from 'crypto';

/**
 * CSV Export Endpoint for Users
 *
 * GET /api/admin/export/users/csv?createdAfter=2025-01-01&hasTag=vip&exportConsentOnly=true
 *
 * Exports user data to CSV format with all the same filters as the users API
 */
export async function GET(request: NextRequest) {
  try {
    const adminId = request.headers.get('x-admin-id') || 'default-admin';
    const searchParams = request.nextUrl.searchParams;

    // Filters (same as users API)
    const createdAfter = searchParams.get('createdAfter');
    const createdBefore = searchParams.get('createdBefore');
    const updatedAfter = searchParams.get('updatedAfter');
    const hasTag = searchParams.get('hasTag');
    const optedIn = searchParams.get('optedIn');
    const search = searchParams.get('search');
    const exportConsentOnly = searchParams.get('exportConsentOnly') === 'true';

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
      },
      orderBy: { createdAt: 'desc' },
    });

    // Flatten data for CSV
    const rows = users.map((user) => {
      const customFields: Record<string, any> = {};
      user.customFieldValues.forEach((cfv) => {
        customFields[`cf_${cfv.field.name}`] = cfv.value;
      });

      return {
        id: user.id,
        manychat_id: user.manychatId,
        instagram_id: user.instagramId || '',
        instagram_username: user.igUsername || '',
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        whatsapp_phone: user.whatsappPhone || '',
        gender: user.gender || '',
        locale: user.locale || '',
        timezone: user.timezone || '',
        opted_in_messenger: user.optedInMessenger ? 'Yes' : 'No',
        opted_in_instagram: user.optedInInstagram ? 'Yes' : 'No',
        opted_in_whatsapp: user.optedInWhatsapp ? 'Yes' : 'No',
        opted_in_telegram: user.optedInTelegram ? 'Yes' : 'No',
        export_consent_given: user.exportConsentGiven ? 'Yes' : 'No',
        export_consent_at: user.exportConsentAt?.toISOString() || '',
        subscribed_at: user.subscribedAt?.toISOString() || '',
        last_synced_at: user.lastSyncedAt?.toISOString() || '',
        bookings_count: user._count.bookings,
        qr_codes_count: user._count.qrCodes,
        conversations_count: user._count.conversations,
        tags: user.contactTags.map((ct) => ct.tag.name).join('; '),
        created_at: user.createdAt.toISOString(),
        updated_at: user.updatedAt.toISOString(),
        ...customFields,
      };
    });

    // Generate CSV
    const csv = stringify(rows, {
      header: true,
      columns: Object.keys(rows[0] || {}),
    });

    // Generate file hash
    const fileHash = crypto.createHash('sha256').update(csv).digest('hex');
    const fileSizeBytes = Buffer.byteLength(csv, 'utf8');

    // Log export
    await prisma.dataExport.create({
      data: {
        adminId,
        exportType: 'csv',
        recordType: 'users',
        recordCount: users.length,
        fields: JSON.stringify(Object.keys(rows[0] || {})),
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

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`,
        'Content-Length': fileSizeBytes.toString(),
        'X-Export-Count': users.length.toString(),
        'X-File-Hash': fileHash,
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export users to CSV',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
