import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchFromApify, updateCache } from '@/lib/flowkick';

/**
 * Cron job to refresh cached social media data
 * Configured in vercel.json to run periodically
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Flowkick Cron] Starting cache refresh...');

  try {
    // Find caches that need refreshing (expired or expiring soon)
    const expiringCaches = await prisma.socialMediaCache.findMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } }, // Already expired
          {
            expiresAt: {
              lt: new Date(Date.now() + 5 * 60 * 1000), // Expiring in next 5 mins
            },
          },
        ],
        client: {
          active: true, // Only refresh for active clients
        },
      },
      include: {
        client: true,
      },
      orderBy: {
        expiresAt: 'asc', // Refresh most urgent first
      },
      take: 50, // Limit to 50 caches per run to avoid timeout
    });

    console.log(`[Flowkick Cron] Found ${expiringCaches.length} caches to refresh`);

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
    };

    // Refresh each cache
    for (const cache of expiringCaches) {
      const client = cache.client;

      console.log(
        `[Flowkick Cron] Refreshing ${cache.platform} for client ${client.name}`
      );

      try {
        // Fetch fresh data
        const apifyResult = await fetchFromApify(
          client.id,
          cache.platform,
          client.apifyApiToken || undefined,
          client.apifyUserId || undefined
        );

        if (apifyResult.success && apifyResult.data) {
          // Update cache
          await updateCache(
            client.id,
            cache.platform,
            cache.dataType,
            apifyResult.data,
            client.cacheRefreshInterval,
            {
              apifyDatasetId: apifyResult.metadata?.datasetId,
              apifyRunId: apifyResult.metadata?.runId,
              fetchDurationMs: apifyResult.metadata?.fetchDurationMs,
            }
          );

          console.log(
            `[Flowkick Cron] ✓ Refreshed ${cache.platform} for ${client.name} (${apifyResult.data.length} items)`
          );

          results.success++;
        } else {
          console.error(
            `[Flowkick Cron] ✗ Failed to refresh ${cache.platform} for ${client.name}: ${apifyResult.error}`
          );
          results.failed++;
        }
      } catch (error) {
        console.error(
          `[Flowkick Cron] ✗ Error refreshing ${cache.platform} for ${client.name}:`,
          error
        );
        results.failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log('[Flowkick Cron] Cache refresh completed', results);

    return NextResponse.json({
      success: true,
      message: 'Cache refresh completed',
      results: {
        totalProcessed: expiringCaches.length,
        successful: results.success,
        failed: results.failed,
        skipped: results.skipped,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Flowkick Cron] Error:', error);
    return NextResponse.json(
      {
        error: 'Cache refresh failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
