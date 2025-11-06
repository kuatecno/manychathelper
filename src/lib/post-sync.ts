/**
 * Instagram Post Sync Service
 *
 * Synchronizes Instagram posts from Flowkick cache to database
 * for categorization and website publishing
 */

import { prisma } from '@/lib/prisma';
import { getCachedData, fetchFromApify } from '@/lib/flowkick';

interface InstagramPostData {
  id: string;
  platform: string;
  imageUrl?: string;
  videoUrl?: string;
  carouselImages?: Array<{
    url: string;
    type: string;
    videoUrl?: string;
  }>;
  postUrl: string;
  caption?: string;
  hashtags?: string[];
  mentions?: string[];
  locationName?: string;
  ownerUsername?: string;
  timestamp: string;
  likes: number;
  comments: number;
  type: string;
  shortCode: string;
}

export interface SyncResult {
  success: boolean;
  postsCreated: number;
  postsUpdated: number;
  postsSkipped: number;
  totalPosts: number;
  error?: string;
  lastSyncedAt: Date;
}

/**
 * Sync Instagram posts from cache to database for an admin
 *
 * @param adminId - The admin who owns these posts
 * @param clientId - Optional FlowkickClient ID to sync from specific cache
 * @param forceFetch - Force fresh fetch from Apify instead of using cache
 * @returns SyncResult with stats
 */
export async function syncInstagramPosts(
  adminId: string,
  clientId?: string,
  forceFetch: boolean = false
): Promise<SyncResult> {
  try {
    // Get admin's Flowkick client
    if (!clientId) {
      // Try to find the admin's default client
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: { email: true },
      });

      if (!admin) {
        return {
          success: false,
          postsCreated: 0,
          postsUpdated: 0,
          postsSkipped: 0,
          totalPosts: 0,
          error: 'Admin not found',
          lastSyncedAt: new Date(),
        };
      }

      // Find client by admin email
      const client = await prisma.flowkickClient.findUnique({
        where: { email: admin.email },
      });

      if (!client) {
        return {
          success: false,
          postsCreated: 0,
          postsUpdated: 0,
          postsSkipped: 0,
          totalPosts: 0,
          error: 'No Flowkick client found for this admin',
          lastSyncedAt: new Date(),
        };
      }

      clientId = client.id;
    }

    let instagramPosts: InstagramPostData[] = [];

    if (forceFetch) {
      // Force fresh fetch from Apify
      const client = await prisma.flowkickClient.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        return {
          success: false,
          postsCreated: 0,
          postsUpdated: 0,
          postsSkipped: 0,
          totalPosts: 0,
          error: 'Flowkick client not found',
          lastSyncedAt: new Date(),
        };
      }

      const apifyResult = await fetchFromApify(
        clientId,
        'instagram',
        client.apifyApiToken || undefined,
        client.apifyUserId || undefined
      );

      if (!apifyResult.success || !apifyResult.data) {
        return {
          success: false,
          postsCreated: 0,
          postsUpdated: 0,
          postsSkipped: 0,
          totalPosts: 0,
          error: apifyResult.error || 'Failed to fetch from Apify',
          lastSyncedAt: new Date(),
        };
      }

      instagramPosts = apifyResult.data as InstagramPostData[];
    } else {
      // Use cached data
      const { hit, data } = await getCachedData(clientId, 'instagram', 'posts');

      if (!hit || !data) {
        // No cache, try to fetch
        return syncInstagramPosts(adminId, clientId, true);
      }

      instagramPosts = data as InstagramPostData[];
    }

    // Sync posts to database
    let postsCreated = 0;
    let postsUpdated = 0;
    let postsSkipped = 0;

    for (const postData of instagramPosts) {
      try {
        // Check if post already exists
        const existingPost = await prisma.instagramPost.findUnique({
          where: { shortCode: postData.shortCode },
        });

        if (existingPost) {
          // Update engagement metrics and other fields
          await prisma.instagramPost.update({
            where: { shortCode: postData.shortCode },
            data: {
              likes: postData.likes,
              comments: postData.comments,
              caption: postData.caption || existingPost.caption,
              hashtags: postData.hashtags ? JSON.stringify(postData.hashtags) : existingPost.hashtags,
              mentions: postData.mentions ? JSON.stringify(postData.mentions) : existingPost.mentions,
              locationName: postData.locationName || existingPost.locationName,
              imageUrl: postData.imageUrl || existingPost.imageUrl,
              videoUrl: postData.videoUrl || existingPost.videoUrl,
              carouselImages: postData.carouselImages
                ? JSON.stringify(postData.carouselImages)
                : existingPost.carouselImages,
              lastSyncedAt: new Date(),
            },
          });
          postsUpdated++;
        } else {
          // Create new post
          await prisma.instagramPost.create({
            data: {
              adminId,
              shortCode: postData.shortCode,
              postUrl: postData.postUrl,
              caption: postData.caption,
              type: postData.type,
              imageUrl: postData.imageUrl,
              videoUrl: postData.videoUrl,
              carouselImages: postData.carouselImages ? JSON.stringify(postData.carouselImages) : null,
              hashtags: postData.hashtags ? JSON.stringify(postData.hashtags) : null,
              mentions: postData.mentions ? JSON.stringify(postData.mentions) : null,
              locationName: postData.locationName,
              likes: postData.likes,
              comments: postData.comments,
              timestamp: new Date(postData.timestamp),
              websiteEnabled: false,
              displayOrder: 0,
            },
          });
          postsCreated++;
        }
      } catch (error) {
        console.error(`Failed to sync post ${postData.shortCode}:`, error);
        postsSkipped++;
      }
    }

    return {
      success: true,
      postsCreated,
      postsUpdated,
      postsSkipped,
      totalPosts: instagramPosts.length,
      lastSyncedAt: new Date(),
    };
  } catch (error) {
    console.error('Instagram post sync error:', error);
    return {
      success: false,
      postsCreated: 0,
      postsUpdated: 0,
      postsSkipped: 0,
      totalPosts: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      lastSyncedAt: new Date(),
    };
  }
}

/**
 * Get sync stats for an admin
 */
export async function getSyncStats(adminId: string) {
  const totalPosts = await prisma.instagramPost.count({
    where: { adminId },
  });

  const publishedPosts = await prisma.instagramPost.count({
    where: { adminId, websiteEnabled: true },
  });

  const categorizedPosts = await prisma.instagramPost.count({
    where: {
      adminId,
      categoryAssignments: {
        some: {},
      },
    },
  });

  const lastSyncedPost = await prisma.instagramPost.findFirst({
    where: { adminId },
    orderBy: { lastSyncedAt: 'desc' },
    select: { lastSyncedAt: true },
  });

  return {
    totalPosts,
    publishedPosts,
    categorizedPosts,
    uncategorizedPosts: totalPosts - categorizedPosts,
    lastSyncedAt: lastSyncedPost?.lastSyncedAt,
  };
}

/**
 * Delete posts that are no longer in the Instagram feed
 * (useful for cleanup after posts are deleted from Instagram)
 */
export async function cleanupDeletedPosts(
  adminId: string,
  currentShortCodes: string[]
): Promise<number> {
  const result = await prisma.instagramPost.deleteMany({
    where: {
      adminId,
      shortCode: {
        notIn: currentShortCodes,
      },
    },
  });

  return result.count;
}
