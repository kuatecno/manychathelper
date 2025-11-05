import { NextRequest, NextResponse } from 'next/server';
import { getClientUsageStats } from '@/lib/flowkick';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/admin/flowkick-clients/{clientId}/stats
 * Get usage statistics for a Flowkick client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    // TODO: Add admin authentication
    const { clientId } = await params;

    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');

    // Get client info
    const client = await prisma.flowkickClient.findUnique({
      where: { id: clientId },
      include: {
        socialMediaCache: {
          orderBy: { fetchedAt: 'desc' },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get usage stats
    const stats = await getClientUsageStats(clientId, days);

    // Get cache status
    const cacheStatus = client.socialMediaCache.map((cache) => ({
      platform: cache.platform,
      dataType: cache.dataType,
      itemCount: cache.itemCount,
      isFresh: cache.isFresh,
      fetchedAt: cache.fetchedAt,
      expiresAt: cache.expiresAt,
      ageMinutes: Math.floor(
        (Date.now() - cache.fetchedAt.getTime()) / 1000 / 60
      ),
    }));

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        plan: client.plan,
        active: client.active,
      },
      usage: {
        period: `Last ${days} days`,
        totalRequests: stats.totalRequests,
        monthlyRequestsUsed: client.monthlyRequestsUsed,
        monthlyRequestsLimit: client.monthlyRequestsLimit,
        remainingRequests:
          client.monthlyRequestsLimit - client.monthlyRequestsUsed,
        usagePercentage:
          (client.monthlyRequestsUsed / client.monthlyRequestsLimit) * 100,
        cacheHitRate: stats.cacheHitRate.toFixed(2) + '%',
        avgResponseTime: Math.round(stats.avgResponseTime) + 'ms',
        requestsByPlatform: stats.requestsByPlatform,
        requestsByDay: stats.requestsByDay,
      },
      cache: {
        status: cacheStatus,
        refreshInterval: client.cacheRefreshInterval + ' minutes',
      },
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
