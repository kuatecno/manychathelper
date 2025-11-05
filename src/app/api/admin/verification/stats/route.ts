import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get verification statistics for an admin
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json(
        { error: 'adminId parameter is required' },
        { status: 400 }
      );
    }

    // Get total verifications
    const totalVerifications = await prisma.instagramVerification.count({
      where: { adminId },
    });

    // Get successful verifications
    const successfulVerifications = await prisma.instagramVerification.count({
      where: {
        adminId,
        status: 'verified',
      },
    });

    // Get pending verifications
    const pendingVerifications = await prisma.instagramVerification.count({
      where: {
        adminId,
        status: 'pending',
        expiresAt: { gte: new Date() }, // Not expired
      },
    });

    // Get expired verifications
    const expiredVerifications = await prisma.instagramVerification.count({
      where: {
        adminId,
        status: 'expired',
      },
    });

    // Get failed verifications
    const failedVerifications = await prisma.instagramVerification.count({
      where: {
        adminId,
        status: 'failed',
      },
    });

    // Get recent verifications (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentVerifications = await prisma.instagramVerification.count({
      where: {
        adminId,
        createdAt: { gte: yesterday },
      },
    });

    // Get success rate
    const successRate = totalVerifications > 0
      ? (successfulVerifications / totalVerifications) * 100
      : 0;

    // Get verifications by website
    const verificationsByWebsite = await prisma.instagramVerification.groupBy({
      by: ['externalWebsite'],
      where: { adminId },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Get recent successful verifications
    const recentSuccessful = await prisma.instagramVerification.findMany({
      where: {
        adminId,
        status: 'verified',
      },
      orderBy: {
        verifiedAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        code: true,
        igUsername: true,
        externalWebsite: true,
        verifiedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      stats: {
        total: totalVerifications,
        successful: successfulVerifications,
        pending: pendingVerifications,
        expired: expiredVerifications,
        failed: failedVerifications,
        recent_24h: recentVerifications,
        success_rate: parseFloat(successRate.toFixed(2)),
      },
      by_website: verificationsByWebsite.map(item => ({
        website: item.externalWebsite,
        count: item._count.id,
      })),
      recent_successful: recentSuccessful,
    });
  } catch (error) {
    console.error('Error fetching verification stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification statistics' },
      { status: 500 }
    );
  }
}
