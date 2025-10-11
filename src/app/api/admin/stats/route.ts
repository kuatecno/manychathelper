import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Bookings stats
    const [
      totalBookings,
      todayBookings,
      weekBookings,
      monthBookings,
      pendingBookings,
      confirmedBookings,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.booking.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.booking.count({ where: { status: 'pending' } }),
      prisma.booking.count({ where: { status: 'confirmed' } }),
    ]);

    // Helper stats
    const [totalHelpers, activeHelpers] = await Promise.all([
      prisma.helper.count(),
      prisma.helper.count({ where: { active: true } }),
    ]);

    // QR Code stats
    const [totalQRCodes, activeQRCodes, scannedQRCodes] = await Promise.all([
      prisma.qRCode.count(),
      prisma.qRCode.count({ where: { active: true, scannedAt: null } }),
      prisma.qRCode.count({ where: { scannedAt: { not: null } } }),
    ]);

    // User stats
    const totalUsers = await prisma.user.count();

    // Upcoming bookings
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        startTime: { gte: now },
        status: { in: ['pending', 'confirmed'] },
      },
      include: {
        user: true,
        helper: true,
      },
      orderBy: { startTime: 'asc' },
      take: 10,
    });

    // Recent QR codes
    const recentQRCodes = await prisma.qRCode.findMany({
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      bookings: {
        total: totalBookings,
        today: todayBookings,
        week: weekBookings,
        month: monthBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
      },
      helpers: {
        total: totalHelpers,
        active: activeHelpers,
      },
      qrCodes: {
        total: totalQRCodes,
        active: activeQRCodes,
        scanned: scannedQRCodes,
      },
      users: {
        total: totalUsers,
      },
      upcomingBookings: upcomingBookings.map((b) => ({
        id: b.id,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        status: b.status,
        userName: `${b.user.firstName || ''} ${b.user.lastName || ''}`.trim() || 'Unknown',
        helperName: b.helper.name,
      })),
      recentQRCodes: recentQRCodes.map((qr) => ({
        id: qr.id,
        code: qr.code,
        type: qr.type,
        scanned: !!qr.scannedAt,
        createdAt: qr.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
