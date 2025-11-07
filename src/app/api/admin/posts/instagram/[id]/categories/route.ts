import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for category assignments
const assignCategoriesSchema = z.object({
  categoryIds: z.array(z.string()).min(1, 'At least one category ID required'),
  action: z.enum(['add', 'remove', 'set']).optional().default('add'),
});

/**
 * POST /api/admin/posts/instagram/[id]/categories
 * Assign or remove categories from a post
 *
 * Actions:
 * - add: Add new categories (preserves existing)
 * - remove: Remove specified categories
 * - set: Replace all categories with specified ones
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get adminId from header
    const adminId = request.headers.get('x-admin-id');

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const { id: postId } = await params;

    // Check if post exists and belongs to admin
    const post = await prisma.instagramPost.findUnique({
      where: { id: postId },
      include: {
        categoryAssignments: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.adminId !== admin.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = assignCategoriesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { categoryIds, action } = validationResult.data;

    // Verify all categories exist and belong to admin
    const categories = await prisma.postCategory.findMany({
      where: {
        id: { in: categoryIds },
        adminId: admin.id,
      },
    });

    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: 'One or more categories not found or unauthorized' },
        { status: 400 }
      );
    }

    // Perform action
    if (action === 'set') {
      // Remove all existing assignments and add new ones
      await prisma.postCategoryAssignment.deleteMany({
        where: { postId },
      });

      await prisma.postCategoryAssignment.createMany({
        data: categoryIds.map((categoryId) => ({
          postId,
          categoryId,
          assignedBy: admin.id,
        })),
        skipDuplicates: true,
      });
    } else if (action === 'add') {
      // Add new categories (skip duplicates)
      await prisma.postCategoryAssignment.createMany({
        data: categoryIds.map((categoryId) => ({
          postId,
          categoryId,
          assignedBy: admin.id,
        })),
        skipDuplicates: true,
      });
    } else if (action === 'remove') {
      // Remove specified categories
      await prisma.postCategoryAssignment.deleteMany({
        where: {
          postId,
          categoryId: { in: categoryIds },
        },
      });
    }

    // Fetch updated post with categories
    const updatedPost = await prisma.instagramPost.findUnique({
      where: { id: postId },
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

    return NextResponse.json({
      success: true,
      message: `Categories ${action === 'add' ? 'added' : action === 'remove' ? 'removed' : 'updated'} successfully`,
      post: {
        id: updatedPost!.id,
        shortCode: updatedPost!.shortCode,
        categories: updatedPost!.categoryAssignments.map((assignment) => ({
          id: assignment.category.id,
          name: assignment.category.name,
          color: assignment.category.color,
          icon: assignment.category.icon,
          assignedAt: assignment.assignedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Error managing post categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/posts/instagram/[id]/categories
 * Get all categories assigned to a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get adminId from header
    const adminId = request.headers.get('x-admin-id');

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const { id: postId } = await params;

    // Check if post exists and belongs to admin
    const post = await prisma.instagramPost.findUnique({
      where: { id: postId },
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

    if (post.adminId !== admin.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      categories: post.categoryAssignments.map((assignment) => ({
        id: assignment.category.id,
        name: assignment.category.name,
        description: assignment.category.description,
        color: assignment.category.color,
        icon: assignment.category.icon,
        assignedAt: assignment.assignedAt.toISOString(),
        assignedBy: assignment.assignedBy,
      })),
    });
  } catch (error) {
    console.error('Error fetching post categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
