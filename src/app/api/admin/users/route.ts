import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            bookings: true,
            qrCodes: true,
          },
        },
        contactTags: {
          include: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
        customFieldValues: {
          include: {
            field: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
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
        lastSyncedAt: u.lastSyncedAt?.toISOString() || null,
        bookingsCount: u._count.bookings,
        qrCodesCount: u._count.qrCodes,
        tags: u.contactTags.map((ct) => ({ name: ct.tag.name })),
        customFields: u.customFieldValues.map((cfv) => ({
          name: cfv.field.name,
          type: cfv.field.type,
          value: cfv.value,
        })),
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
