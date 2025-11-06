import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/v1/posts
 * Public API endpoint for websites to fetch published Instagram posts
 *
 * Authentication: Requires admin username or API key
 *
 * Query parameters:
 * - username: Admin username (required if no api_key)
 * - api_key: Admin API key (alternative to username)
 * - category: Category name or ID to filter by
 * - limit: Number of posts (max 100, default 20)
 * - offset: Pagination offset
 * - sortBy: timestamp (default), likes, comments, displayOrder
 * - sortOrder: desc (default), asc
 */
export async function GET(request: NextRequest) {
  try {
    // Get authentication parameters
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');
    const apiKey = searchParams.get('api_key') || request.headers.get('x-api-key');

    if (!username && !apiKey) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Provide username or api_key parameter',
        },
        { status: 401 }
      );
    }

    // Find admin by username or API key
    let admin;
    if (apiKey) {
      // TODO: Implement API key authentication
      // For now, just return error
      return NextResponse.json(
        {
          error: 'API key authentication not yet implemented',
          message: 'Please use username parameter',
        },
        { status: 501 }
      );
    } else if (username) {
      admin = await prisma.admin.findUnique({
        where: { username },
      });

      if (!admin) {
        return NextResponse.json(
          { error: 'Admin not found' },
          { status: 404 }
        );
      }
    }

    if (!admin) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get query parameters
    const categoryParam = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'timestamp';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause - only published posts
    const where: Prisma.InstagramPostWhereInput = {
      adminId: admin.id,
      websiteEnabled: true,
    };

    // Filter by category if provided
    if (categoryParam) {
      // Check if it's a category ID or name
      const category = await prisma.postCategory.findFirst({
        where: {
          adminId: admin.id,
          OR: [
            { id: categoryParam },
            { name: { equals: categoryParam, mode: 'insensitive' } },
          ],
        },
      });

      if (category) {
        where.categoryAssignments = {
          some: {
            categoryId: category.id,
          },
        };
      } else {
        // Category not found, return empty results
        return NextResponse.json({
          success: true,
          posts: [],
          pagination: {
            total: 0,
            limit,
            offset,
            hasMore: false,
          },
        });
      }
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

    // Format response - only include public-safe data
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

      return {
        id: post.id,
        shortCode: post.shortCode,
        postUrl: post.postUrl,
        caption: post.customDescription || post.caption,
        title: post.customTitle,
        type: post.type,
        imageUrl: post.imageUrl,
        videoUrl: post.videoUrl,
        carouselImages,
        hashtags,
        locationName: post.locationName,
        likes: post.likes,
        comments: post.comments,
        timestamp: post.timestamp.toISOString(),
        displayOrder: post.displayOrder,
        categories: post.categoryAssignments.map((assignment) => ({
          id: assignment.category.id,
          name: assignment.category.name,
          color: assignment.category.color,
          icon: assignment.category.icon,
        })),
      };
    });

    // Return response with CORS headers
    const response = NextResponse.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });

    // Add CORS headers for website access
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

    return response;
  } catch (error) {
    console.error('Error fetching public posts:', error);
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
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  return response;
}
