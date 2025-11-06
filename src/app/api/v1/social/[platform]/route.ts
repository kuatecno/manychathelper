import { NextRequest, NextResponse } from 'next/server';
import {
  validateFlowkickApiKey,
  getCachedData,
  fetchFromApify,
  updateCache,
  trackApiUsage,
  sanitizeMetadata,
  getCacheIntervalWithJitter,
  getSanitizedHeaders,
} from '@/lib/flowkick';

/**
 * Flowkick Social Media API v1
 * GET /api/v1/social/{platform}?api_key=xxx
 *
 * Supported platforms: instagram, tiktok, google_maps
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const startTime = Date.now();
  const { platform } = await params;

  // Get API key from header or query
  const apiKey =
    request.headers.get('x-api-key') ||
    request.nextUrl.searchParams.get('api_key');

  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'Missing API key',
        message: 'Provide API key via X-API-Key header or api_key query parameter',
      },
      { status: 401 }
    );
  }

  // Validate API key
  const { valid, client, error } = await validateFlowkickApiKey(apiKey);

  if (!valid || !client) {
    return NextResponse.json(
      { error: 'Authentication failed', message: error || 'Invalid API key' },
      { status: 401 }
    );
  }

  // Validate platform
  const supportedPlatforms = ['instagram', 'tiktok', 'google_maps'];
  if (!supportedPlatforms.includes(platform)) {
    await trackApiUsage(
      client.id,
      `/api/v1/social/${platform}`,
      platform,
      400,
      false,
      Date.now() - startTime,
      {
        errorMessage: 'Unsupported platform',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        origin: request.headers.get('origin') || undefined,
      }
    );

    return NextResponse.json(
      {
        error: 'Unsupported platform',
        message: `Platform must be one of: ${supportedPlatforms.join(', ')}`,
      },
      { status: 400 }
    );
  }

  // Check if client has configured this platform
  const platformConfig = getPlatformConfig(client, platform);
  if (!platformConfig) {
    await trackApiUsage(
      client.id,
      `/api/v1/social/${platform}`,
      platform,
      400,
      false,
      Date.now() - startTime,
      {
        errorMessage: 'Platform not configured',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        origin: request.headers.get('origin') || undefined,
      }
    );

    return NextResponse.json(
      {
        error: 'Platform not configured',
        message: `Please configure your ${platform} account in your Flowkick dashboard`,
      },
      { status: 400 }
    );
  }

  try {
    // Check cache first
    const { hit, data: cachedData, cache } = await getCachedData(
      client.id,
      platform,
      'posts'
    );

    if (hit && cachedData) {
      console.log(`[Flowkick] Cache HIT for ${client.name} / ${platform}`);

      // Track usage
      await trackApiUsage(
        client.id,
        `/api/v1/social/${platform}`,
        platform,
        200,
        true, // cache hit
        Date.now() - startTime,
        {
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
          origin: request.headers.get('origin') || undefined,
          responseSizeBytes: JSON.stringify(cachedData).length,
        }
      );

      // Build response with sanitized metadata
      const response = NextResponse.json({
        success: true,
        data: cachedData,
        meta: {
          platform,
          count: cachedData.length,
          cached: true,
          fetchedAt: cache.fetchedAt.toISOString(),
        },
      });

      // Set sanitized headers (no traces of Apify or infrastructure)
      const headers = getSanitizedHeaders(true);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    }

    console.log(`[Flowkick] Cache MISS for ${client.name} / ${platform} - Fetching fresh data`);

    // Fetch fresh data
    const apifyResult = await fetchFromApify(
      client.id,
      platform,
      client.apifyApiToken || undefined,
      client.apifyUserId || undefined
    );

    if (!apifyResult.success || !apifyResult.data) {
      await trackApiUsage(
        client.id,
        `/api/v1/social/${platform}`,
        platform,
        500,
        false,
        Date.now() - startTime,
        {
          errorMessage: apifyResult.error,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || undefined,
          origin: request.headers.get('origin') || undefined,
        }
      );

      return NextResponse.json(
        {
          error: 'Failed to fetch data',
          message: apifyResult.error || 'Unknown error',
        },
        { status: 500 }
      );
    }

    // Update cache with jitter to avoid predictable patterns
    const refreshInterval = getCacheIntervalWithJitter(client.cacheRefreshInterval);
    await updateCache(
      client.id,
      platform,
      'posts',
      apifyResult.data,
      refreshInterval,
      {
        apifyDatasetId: apifyResult.metadata?.datasetId,
        apifyRunId: apifyResult.metadata?.runId,
        fetchDurationMs: apifyResult.metadata?.fetchDurationMs,
      }
    );

    console.log(`[Flowkick] Cached ${apifyResult.data.length} items for ${client.name} / ${platform}`);

    // Track usage
    await trackApiUsage(
      client.id,
      `/api/v1/social/${platform}`,
      platform,
      200,
      false, // cache miss
      Date.now() - startTime,
      {
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        origin: request.headers.get('origin') || undefined,
        responseSizeBytes: JSON.stringify(apifyResult.data).length,
      }
    );

    // Return fresh data with sanitized metadata
    const response = NextResponse.json({
      success: true,
      data: apifyResult.data,
      meta: {
        platform,
        count: apifyResult.data.length,
        cached: false,
        fetchedAt: new Date().toISOString(),
      },
    });

    // Set sanitized headers
    const headers = getSanitizedHeaders(false);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('[Flowkick] Error:', error);

    await trackApiUsage(
      client.id,
      `/api/v1/social/${platform}`,
      platform,
      500,
      false,
      Date.now() - startTime,
      {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
        origin: request.headers.get('origin') || undefined,
      }
    );

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
 * Get platform configuration for client
 */
function getPlatformConfig(
  client: any,
  platform: string
): string | null {
  switch (platform) {
    case 'instagram':
      return client.instagramHandle;
    case 'tiktok':
      return client.tiktokHandle;
    case 'google_maps':
      return client.googlePlaceId;
    case 'twitter':
      return client.twitterHandle;
    case 'youtube':
      return client.youtubeChannelId;
    case 'facebook':
      return client.facebookPageId;
    default:
      return null;
  }
}
