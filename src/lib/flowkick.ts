import { prisma } from './prisma';
import crypto from 'crypto';

/**
 * Flowkick Social Media Data Service
 * White-label service to provide social media data to clients
 */

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

/**
 * Generate a new Flowkick API key
 */
export function generateFlowkickApiKey(): string {
  return `fk_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Hash API key for storage (SHA256)
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Validate API key and check rate limits
 */
export async function validateFlowkickApiKey(apiKey: string): Promise<{
  valid: boolean;
  client?: any;
  error?: string;
}> {
  // Hash the API key for lookup
  const hashedKey = hashApiKey(apiKey);

  const client = await prisma.flowkickClient.findUnique({
    where: { apiKey: hashedKey },
    include: {
      socialMediaCache: true,
      dataSources: true,
    },
  });

  if (!client) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (!client.active) {
    return { valid: false, error: 'API key is inactive' };
  }

  // Check if subscription is active
  if (client.subscriptionStatus && !['active', 'trialing'].includes(client.subscriptionStatus)) {
    return { valid: false, error: 'Subscription is not active' };
  }

  // Check monthly rate limit
  if (client.monthlyRequestsUsed >= client.monthlyRequestsLimit) {
    return { valid: false, error: 'Monthly request limit exceeded' };
  }

  // Check if we need to reset the monthly counter
  if (client.requestsResetAt && client.requestsResetAt < new Date()) {
    await prisma.flowkickClient.update({
      where: { id: client.id },
      data: {
        monthlyRequestsUsed: 0,
        requestsResetAt: getNextMonthResetDate(),
      },
    });
    client.monthlyRequestsUsed = 0;
  }

  return { valid: true, client };
}

/**
 * Get date for next monthly reset (1st of next month)
 */
function getNextMonthResetDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Check if cached data exists and is fresh
 */
export async function getCachedData(
  clientId: string,
  platform: string,
  dataType: string = 'posts'
): Promise<{
  hit: boolean;
  data?: any[];
  cache?: any;
}> {
  const cache = await prisma.socialMediaCache.findUnique({
    where: {
      clientId_platform_dataType: {
        clientId,
        platform,
        dataType,
      },
    },
  });

  if (!cache) {
    return { hit: false };
  }

  // Check if cache is expired
  if (cache.expiresAt < new Date()) {
    return { hit: false, cache };
  }

  // Parse JSON data
  try {
    const data = JSON.parse(cache.data);
    return { hit: true, data, cache };
  } catch (error) {
    console.error('Failed to parse cached data:', error);
    return { hit: false };
  }
}

/**
 * Update cache with fresh data
 */
export async function updateCache(
  clientId: string,
  platform: string,
  dataType: string,
  data: any[],
  expiresInMinutes: number = 30,
  metadata?: {
    apifyDatasetId?: string;
    apifyRunId?: string;
    fetchDurationMs?: number;
    transformDurationMs?: number;
    dataSourceId?: string;
  }
): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  const dataString = JSON.stringify(data);

  await prisma.socialMediaCache.upsert({
    where: {
      clientId_platform_dataType: {
        clientId,
        platform,
        dataType,
      },
    },
    update: {
      data: dataString,
      itemCount: data.length,
      fetchedAt: new Date(),
      expiresAt,
      isFresh: true,
      ...metadata,
    },
    create: {
      clientId,
      platform,
      dataType,
      data: dataString,
      itemCount: data.length,
      expiresAt,
      isFresh: true,
      ...metadata,
    },
  });
}

// ============================================================================
// APIFY INTEGRATION
// ============================================================================

/**
 * Fetch data from Apify for a specific client and platform
 */
export async function fetchFromApify(
  clientId: string,
  platform: string,
  apifyApiToken?: string,
  apifyUserId?: string
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
  metadata?: {
    datasetId?: string;
    runId?: string;
    fetchDurationMs?: number;
  };
}> {
  const startTime = Date.now();

  // Use client's Apify credentials or shared ones
  const apiToken = apifyApiToken || process.env.APIFY_API_TOKEN;
  const userId = apifyUserId || process.env.APIFY_USER_ID;

  if (!apiToken || !userId) {
    return {
      success: false,
      error: 'Data source not configured',
    };
  }

  try {
    // Get recent successful runs
    const runsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs?userId=${userId}&token=${apiToken}&limit=10&status=SUCCEEDED&desc=true`
    );

    if (!runsResponse.ok) {
      return {
        success: false,
        error: 'Failed to fetch social media content',
      };
    }

    const runsData = await runsResponse.json();

    if (!runsData.data?.items?.length) {
      return {
        success: false,
        error: 'No content available at this time',
      };
    }

    // Find the right dataset based on platform
    let targetRun = null;
    for (const run of runsData.data.items) {
      if (!run.defaultDatasetId) continue;

      // Test this dataset
      const testResponse = await fetch(
        `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${apiToken}&limit=1`
      );

      if (testResponse.ok) {
        const testData = await testResponse.json();
        if (testData.length > 0 && isCorrectPlatform(testData[0], platform)) {
          targetRun = run;
          break;
        }
      }
    }

    if (!targetRun) {
      return {
        success: false,
        error: `No ${platform} content available`,
      };
    }

    // Fetch full data
    const datasetResponse = await fetch(
      `https://api.apify.com/v2/datasets/${targetRun.defaultDatasetId}/items?token=${apiToken}&limit=50`
    );

    if (!datasetResponse.ok) {
      return {
        success: false,
        error: 'Failed to fetch content',
      };
    }

    const rawData = await datasetResponse.json();

    // Transform data based on platform
    const transformedData = transformApifyData(rawData, platform);

    const fetchDurationMs = Date.now() - startTime;

    return {
      success: true,
      data: transformedData,
      metadata: {
        datasetId: targetRun.defaultDatasetId,
        runId: targetRun.id,
        fetchDurationMs,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if dataset item matches platform
 */
function isCorrectPlatform(item: any, platform: string): boolean {
  switch (platform) {
    case 'instagram':
      return 'shortCode' in item || 'displayUrl' in item;
    case 'tiktok':
      return 'videoMeta' in item || 'createTimeISO' in item;
    case 'google_maps':
      return 'reviews' in item || 'totalScore' in item;
    default:
      return false;
  }
}

/**
 * Transform raw Apify data to Flowkick format
 */
function transformApifyData(rawData: any[], platform: string): any[] {
  const transformStartTime = Date.now();

  switch (platform) {
    case 'instagram':
      return transformInstagramData(rawData);
    case 'tiktok':
      return transformTikTokData(rawData);
    case 'google_maps':
      return transformGoogleMapsData(rawData);
    default:
      return rawData;
  }
}

/**
 * Proxy image URL through Flowkick to hide CDN source
 */
function proxyImageUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  // Proxy through our endpoint to hide Instagram/TikTok CDN
  return `/api/v1/media/proxy?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Transform Instagram data from Apify to Flowkick format
 */
function transformInstagramData(rawData: any[]): any[] {
  const posts: any[] = [];

  rawData.forEach((post, index) => {
    const dateStr = post.timestamp
      ? new Date(
          typeof post.timestamp === 'string' ? Date.parse(post.timestamp) : post.timestamp * 1000
        ).toISOString()
      : new Date().toISOString();

    const postUrl = post.url || `https://www.instagram.com/p/${post.shortCode}/`;

    // Handle carousel posts
    if (post.type === 'Sidecar' && post.childPosts?.length > 0) {
      post.childPosts.forEach((childPost: any, childIndex: number) => {
        const imageUrl = childPost.displayUrl || childPost.url;
        posts.push({
          id: `${post.shortCode}-${childIndex}`,
          platform: 'instagram',
          imageUrl: proxyImageUrl(imageUrl),
          videoUrl: childPost.videoUrl ? proxyImageUrl(childPost.videoUrl) : undefined,
          postUrl,
          caption: post.caption || '',
          timestamp: dateStr,
          likes: post.likesCount || 0,
          comments: post.commentsCount || 0,
          type: childPost.isVideo ? 'video' : 'image',
          shortCode: post.shortCode,
        });
      });
    } else {
      const imageUrl = post.displayUrl || post.thumbnailUrl || post.url;
      posts.push({
        id: post.shortCode || `post-${index}`,
        platform: 'instagram',
        imageUrl: proxyImageUrl(imageUrl),
        videoUrl: post.videoUrl ? proxyImageUrl(post.videoUrl) : undefined,
        postUrl,
        caption: post.caption || '',
        timestamp: dateStr,
        likes: post.likesCount || 0,
        comments: post.commentsCount || 0,
        type: post.type || 'image',
        shortCode: post.shortCode,
      });
    }
  });

  return posts;
}

/**
 * Transform TikTok data from Apify to Flowkick format
 */
function transformTikTokData(rawData: any[]): any[] {
  return rawData.map((video, index) => {
    const dateStr = video.createTimeISO
      ? new Date(Date.parse(video.createTimeISO)).toISOString()
      : new Date().toISOString();

    const coverUrl = video.videoMeta?.coverUrl || video.videoMeta?.dynamicCover || video.authorMeta?.avatar;
    const videoUrl = video.webVideoUrl || video.videoUrl;

    return {
      id: video.id || `tiktok-${index}`,
      platform: 'tiktok',
      imageUrl: proxyImageUrl(coverUrl),
      videoUrl: videoUrl ? proxyImageUrl(videoUrl) : undefined,
      postUrl: video.webVideoUrl || `https://www.tiktok.com/@user/video/${video.id}`,
      caption: video.text || '',
      timestamp: dateStr,
      likes: video.diggCount || video.likesCount || 0,
      comments: video.commentCount || 0,
      shares: video.shareCount || 0,
      views: video.playCount || 0,
      type: 'video',
    };
  });
}

/**
 * Transform Google Maps reviews from Apify to Flowkick format
 */
function transformGoogleMapsData(rawData: any[]): any[] {
  if (!rawData.length || !rawData[0].reviews) {
    return [];
  }

  const place = rawData[0];
  const reviews = place.reviews || [];

  return reviews
    .map((review: any) => {
      const authorPhoto = review.reviewerPhotoUrl || review.reviewerUrl;
      const reviewImages = review.reviewImageUrls || [];

      return {
        id: review.reviewId || crypto.randomBytes(8).toString('hex'),
        platform: 'google_maps',
        authorName: review.name,
        authorPhotoUrl: authorPhoto ? proxyImageUrl(authorPhoto) : undefined,
        rating: review.stars || 0,
        text: review.text || review.textTranslated || '',
        timestamp: review.publishAt || review.publishedAtDate,
        images: reviewImages.map((img: string) => proxyImageUrl(img)),
        likes: review.likesCount || 0,
      };
    })
    .filter((review: any) => review.rating >= 4 && review.text?.length > 0);
}

// ============================================================================
// SECURITY & OBFUSCATION
// ============================================================================

/**
 * Sanitize metadata to remove any traces of Apify or internal implementation
 */
export function sanitizeMetadata(metadata: any): any {
  // Remove any Apify-specific fields
  const sanitized = { ...metadata };
  delete sanitized.apifyDatasetId;
  delete sanitized.apifyRunId;
  delete sanitized.datasetId;
  delete sanitized.runId;
  delete sanitized.fetchDurationMs; // Could reveal scraping
  delete sanitized.transformDurationMs;
  delete sanitized.dataSourceId;

  return sanitized;
}

/**
 * Add random jitter to cache refresh interval
 * Makes timing less predictable
 */
export function getCacheIntervalWithJitter(baseMinutes: number): number {
  // Add ±5 minute jitter
  const jitter = Math.floor(Math.random() * 10) - 5;
  return Math.max(5, baseMinutes + jitter);
}

/**
 * Sanitize response headers - remove upstream service headers
 */
export function getSanitizedHeaders(cacheHit: boolean): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    'X-Cache-Status': cacheHit ? 'HIT' : 'MISS',
    'X-Response-Time': `${Math.floor(Math.random() * 100 + 50)}ms`,
    // Removed: Any X-Apify-* headers
    // Removed: Any X-Vercel-* headers that could reveal infrastructure
  };
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

/**
 * Track API request for analytics and billing
 */
export async function trackApiUsage(
  clientId: string,
  endpoint: string,
  platform: string | undefined,
  statusCode: number,
  cacheHit: boolean,
  responseDurationMs: number,
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    origin?: string;
    errorMessage?: string;
    responseSizeBytes?: number;
  }
): Promise<void> {
  try {
    // Create usage record
    await prisma.apiUsage.create({
      data: {
        clientId,
        endpoint,
        platform,
        statusCode,
        cacheHit,
        responseDurationMs,
        ...metadata,
      },
    });

    // Increment client usage counters
    await prisma.flowkickClient.update({
      where: { id: clientId },
      data: {
        monthlyRequestsUsed: { increment: 1 },
        totalRequestsAllTime: { increment: 1 },
        lastRequestAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to track API usage:', error);
    // Don't throw - usage tracking shouldn't break the API
  }
}

/**
 * Get client usage statistics
 */
export async function getClientUsageStats(clientId: string, days: number = 30): Promise<{
  totalRequests: number;
  cacheHitRate: number;
  avgResponseTime: number;
  requestsByPlatform: { [platform: string]: number };
  requestsByDay: { date: string; count: number }[];
}> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const usage = await prisma.apiUsage.findMany({
    where: {
      clientId,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalRequests = usage.length;
  const cacheHits = usage.filter((u) => u.cacheHit).length;
  const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

  const totalResponseTime = usage.reduce((sum, u) => sum + (u.responseDurationMs || 0), 0);
  const avgResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;

  // Group by platform
  const requestsByPlatform: { [platform: string]: number } = {};
  usage.forEach((u) => {
    const platform = u.platform || 'unknown';
    requestsByPlatform[platform] = (requestsByPlatform[platform] || 0) + 1;
  });

  // Group by day
  const requestsByDay: { [date: string]: number } = {};
  usage.forEach((u) => {
    const date = u.createdAt.toISOString().split('T')[0];
    requestsByDay[date] = (requestsByDay[date] || 0) + 1;
  });

  return {
    totalRequests,
    cacheHitRate,
    avgResponseTime,
    requestsByPlatform,
    requestsByDay: Object.entries(requestsByDay).map(([date, count]) => ({ date, count })),
  };
}
