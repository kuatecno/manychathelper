import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/admin/posts/instagram
 * List Instagram posts with filtering, pagination, and search
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filtering
    const categoryId = searchParams.get('categoryId');
    const websiteEnabled = searchParams.get('websiteEnabled');
    const type = searchParams.get('type'); // image, video, Sidecar
    const hasCategories = searchParams.get('hasCategories'); // true/false
    const search = searchParams.get('search'); // Search in caption, hashtags

    // Date range
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: Prisma.InstagramPostWhereInput = {
      adminId: admin.id,
    };

    // Filter by category
    if (categoryId) {
      where.categoryAssignments = {
        some: {
          categoryId,
        },
      };
    }

    // Filter by website enabled
    if (websiteEnabled !== null) {
      where.websiteEnabled = websiteEnabled === 'true';
    }

    // Filter by type
    if (type) {
      where.type = type;
    }

    // Filter by has/no categories
    if (hasCategories === 'true') {
      where.categoryAssignments = {
        some: {},
      };
    } else if (hasCategories === 'false') {
      where.categoryAssignments = {
        none: {},
      };
    }

    // Date range filter
    if (fromDate || toDate) {
      where.timestamp = {};
      if (fromDate) {
        where.timestamp.gte = new Date(fromDate);
      }
      if (toDate) {
        where.timestamp.lte = new Date(toDate);
      }
    }

    // Search in caption and hashtags
    if (search) {
      where.OR = [
        { caption: { contains: search, mode: 'insensitive' } },
        { hashtags: { contains: search, mode: 'insensitive' } },
        { mentions: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const orderBy: Prisma.InstagramPostOrderByWithRelationInput = {};
    if (sortBy === 'timestamp') {
      orderBy.timestamp = sortOrder as 'asc' | 'desc';
    } else if (sortBy === 'likes') {
      orderBy.likes = sortOrder as 'asc' | 'desc';
    } else if (sortBy === 'comments') {
      orderBy.comments = sortOrder as 'asc' | 'desc';
    } else if (sortBy === 'displayOrder') {
      orderBy.displayOrder = sortOrder as 'asc' | 'desc';
    }

    // Fetch posts
    const [posts, totalCount] = await Promise.all([
      prisma.instagramPost.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          categoryAssignments: {
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                  icon: true,
                },
              },
            },
          },
        },
      }),
      prisma.instagramPost.count({ where }),
    ]);

    // Format response
    const formattedPosts = posts.map((post) => {
      let carouselImages = null;
      if (post.carouselImages) {
        try {
          carouselImages = JSON.parse(post.carouselImages);
        } catch (e) {
          console.error('Failed to parse carouselImages:', e);
        }
      }

      let hashtags = null;
      if (post.hashtags) {
        try {
          hashtags = JSON.parse(post.hashtags);
        } catch (e) {
          console.error('Failed to parse hashtags:', e);
        }
      }

      let mentions = null;
      if (post.mentions) {
        try {
          mentions = JSON.parse(post.mentions);
        } catch (e) {
          console.error('Failed to parse mentions:', e);
        }
      }

      return {
        id: post.id,
        shortCode: post.shortCode,
        postUrl: post.postUrl,
        caption: post.caption,
        type: post.type,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        carouselImages,
        hashtags,
        mentions,
        locationName: post.locationName,
        likes: post.likes,
        comments: post.comments,
        timestamp: post.timestamp.toISOString(),
        websiteEnabled: post.websiteEnabled,
        customTitle: post.customTitle,
        customDescription: post.customDescription,
        displayOrder: post.displayOrder,
        lastSyncedAt: post.lastSyncedAt.toISOString(),
        createdAt: post.createdAt.toISOString(),
        categories: post.categoryAssignments.map((assignment) => ({
          id: assignment.category.id,
          name: assignment.category.name,
          color: assignment.category.color,
          icon: assignment.category.icon,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
