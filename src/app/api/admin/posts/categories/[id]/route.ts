import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating categories
const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().max(50).optional(),
  displayOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

/**
 * GET /api/admin/posts/categories/[id]
 * Get a specific category with post count
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

    // Fetch category with post count
    const category = await prisma.postCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { postAssignments: true },
        },
        postAssignments: {
          include: {
            post: {
              select: {
                id: true,
                shortCode: true,
                imageUrl: true,
                caption: true,
                timestamp: true,
                likes: true,
                comments: true,
              },
            },
          },
          orderBy: {
            assignedAt: 'desc',
          },
          take: 10, // Latest 10 posts
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Verify ownership
    if (category.adminId !== admin.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        active: category.active,
        displayOrder: category.displayOrder,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
        postCount: category._count.postAssignments,
        recentPosts: category.postAssignments.map((assignment) => ({
          id: assignment.post.id,
          shortCode: assignment.post.shortCode,
          imageUrl: assignment.post.imageUrl,
          caption: assignment.post.caption,
          timestamp: assignment.post.timestamp.toISOString(),
          likes: assignment.post.likes,
          comments: assignment.post.comments,
          assignedAt: assignment.assignedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/posts/categories/[id]
 * Update a category
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

    // Check if category exists and belongs to admin
    const existingCategory = await prisma.postCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (existingCategory.adminId !== admin.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateCategorySchema.safeParse(body);

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

    // If name is being changed, check for duplicates
    if (data.name && data.name !== existingCategory.name) {
      const duplicate = await prisma.postCategory.findFirst({
        where: {
          adminId: admin.id,
          name: data.name,
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update category
    const updatedCategory = await prisma.postCategory.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        displayOrder: data.displayOrder,
        active: data.active,
      },
    });

    return NextResponse.json({
      success: true,
      category: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        description: updatedCategory.description,
        color: updatedCategory.color,
        icon: updatedCategory.icon,
        active: updatedCategory.active,
        displayOrder: updatedCategory.displayOrder,
        createdAt: updatedCategory.createdAt.toISOString(),
        updatedAt: updatedCategory.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/posts/categories/[id]
 * Delete a category (and all its post assignments)
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

    // Check if category exists and belongs to admin
    const category = await prisma.postCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { postAssignments: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category.adminId !== admin.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete category (assignments will cascade)
    await prisma.postCategory.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
      postsUnassigned: category._count.postAssignments,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
