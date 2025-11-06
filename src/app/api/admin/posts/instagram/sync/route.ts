import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncInstagramPosts, getSyncStats } from '@/lib/post-sync';

/**
 * POST /api/admin/posts/instagram/sync
 * Sync Instagram posts from Flowkick cache to database
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Get optional parameters
    const body = await request.json().catch(() => ({}));
    const forceFetch = body.forceFetch === true;
    const clientId = body.clientId || undefined;

    // Perform sync
    const syncResult = await syncInstagramPosts(admin.id, clientId, forceFetch);

    if (!syncResult.success) {
      return NextResponse.json(
        {
          error: 'Sync failed',
          message: syncResult.error,
        },
        { status: 500 }
      );
    }

    // Get updated stats
    const stats = await getSyncStats(admin.id);

    return NextResponse.json({
      success: true,
      sync: {
        postsCreated: syncResult.postsCreated,
        postsUpdated: syncResult.postsUpdated,
        postsSkipped: syncResult.postsSkipped,
        totalProcessed: syncResult.totalPosts,
        lastSyncedAt: syncResult.lastSyncedAt.toISOString(),
      },
      stats: {
        totalPosts: stats.totalPosts,
        publishedPosts: stats.publishedPosts,
        categorizedPosts: stats.categorizedPosts,
        uncategorizedPosts: stats.uncategorizedPosts,
        lastSyncedAt: stats.lastSyncedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error syncing Instagram posts:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/posts/instagram/sync
 * Get sync stats without performing sync
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Get stats
    const stats = await getSyncStats(admin.id);

    return NextResponse.json({
      success: true,
      stats: {
        totalPosts: stats.totalPosts,
        publishedPosts: stats.publishedPosts,
        categorizedPosts: stats.categorizedPosts,
        uncategorizedPosts: stats.uncategorizedPosts,
        lastSyncedAt: stats.lastSyncedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching sync stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
