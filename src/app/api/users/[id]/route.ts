import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
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
        contactTags: {
          include: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        manychatId: user.manychatId,
        instagramId: user.instagramId,
        igUsername: user.igUsername,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        whatsappPhone: user.whatsappPhone,
        profilePic: user.profilePic,
        gender: user.gender,
        locale: user.locale,
        timezone: user.timezone,
        subscribedAt: user.subscribedAt?.toISOString() || null,
        optedInMessenger: user.optedInMessenger,
        optedInInstagram: user.optedInInstagram,
        optedInWhatsapp: user.optedInWhatsapp,
        optedInTelegram: user.optedInTelegram,
        lastSyncedAt: user.lastSyncedAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        customFields: user.customFieldValues.map((cfv) => ({
          name: cfv.field.name,
          type: cfv.field.type,
          value: cfv.value ? JSON.parse(cfv.value) : null,
        })),
        tags: user.contactTags.map((ct) => ({
          name: ct.tag.name,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
