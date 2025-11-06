import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating posts
const updatePostSchema = z.object({
  websiteEnabled: z.boolean().optional(),
  customTitle: z.string().max(200).optional().nullable(),
  customDescription: z.string().max(1000).optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
});

/**
 * GET /api/admin/posts/instagram/[id]
 * Get a specific Instagram post with all details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Fetch post with categories
    const post = await prisma.instagramPost.findUnique({
      where: { id },
      include: {
        categoryAssignments: {
          include: {
            category: true,
          },
          orderBy: {
            assignedAt: 'desc',
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Verify ownership
    if (post.adminId !== admin.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse JSON fields
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

    return NextResponse.json({
      success: true,
      post: {
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
        updatedAt: post.updatedAt.toISOString(),
        categories: post.categoryAssignments.map((assignment) => ({
          id: assignment.category.id,
          name: assignment.category.name,
          description: assignment.category.description,
          color: assignment.category.color,
          icon: assignment.category.icon,
          assignedAt: assignment.assignedAt.toISOString(),
          assignedBy: assignment.assignedBy,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/posts/instagram/[id]
 * Update post properties (websiteEnabled, customTitle, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if post exists and belongs to admin
    const existingPost = await prisma.instagramPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.adminId !== admin.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updatePostSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Update post
    const updatedPost = await prisma.instagramPost.update({
      where: { id },
      data: {
        websiteEnabled: data.websiteEnabled,
        customTitle: data.customTitle,
        customDescription: data.customDescription,
        displayOrder: data.displayOrder,
      },
      include: {
        categoryAssignments: {
          include: {
            category: true,
          },
        },
      },
    });

    // Parse JSON fields for response
    let carouselImages = null;
    if (updatedPost.carouselImages) {
      try {
        carouselImages = JSON.parse(updatedPost.carouselImages);
      } catch (e) {
        console.error('Failed to parse carouselImages:', e);
      }
    }

    return NextResponse.json({
      success: true,
      post: {
        id: updatedPost.id,
        shortCode: updatedPost.shortCode,
        postUrl: updatedPost.postUrl,
        caption: updatedPost.caption,
        type: updatedPost.type,
        imageUrl: updatedPost.imageUrl,
        videoUrl: updatedPost.videoUrl,
        carouselImages,
        websiteEnabled: updatedPost.websiteEnabled,
        customTitle: updatedPost.customTitle,
        customDescription: updatedPost.customDescription,
        displayOrder: updatedPost.displayOrder,
        updatedAt: updatedPost.updatedAt.toISOString(),
        categories: updatedPost.categoryAssignments.map((assignment) => ({
          id: assignment.category.id,
          name: assignment.category.name,
          color: assignment.category.color,
        })),
      },
    });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/posts/instagram/[id]
 * Delete a post and all its category assignments
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Check if post exists and belongs to admin
    const post = await prisma.instagramPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.adminId !== admin.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete post (category assignments will cascade)
    await prisma.instagramPost.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
