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
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        manychatId: u.manychatId,
        instagramId: u.instagramId,
        firstName: u.firstName,
        lastName: u.lastName,
        timezone: u.timezone,
        bookingsCount: u._count.bookings,
        qrCodesCount: u._count.qrCodes,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
