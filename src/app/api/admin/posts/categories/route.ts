import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating/updating categories
const categorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icon: z.string().max(50).optional(),
  displayOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

/**
 * GET /api/admin/posts/categories
 * List all categories for the current admin
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const includePostCount = searchParams.get('includePostCount') === 'true';

    // Build where clause
    const where: any = { adminId: admin.id };
    if (!includeInactive) {
      where.active = true;
    }

    // Fetch categories
    const categories = await prisma.postCategory.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: includePostCount
        ? {
            _count: {
              select: { postAssignments: true },
            },
          }
        : undefined,
    });

    // Format response
    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      color: cat.color,
      icon: cat.icon,
      active: cat.active,
      displayOrder: cat.displayOrder,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
      ...(includePostCount && {
        postCount: (cat as any)._count?.postAssignments || 0,
      }),
    }));

    return NextResponse.json({
      success: true,
      categories: formattedCategories,
      total: formattedCategories.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/posts/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = categorySchema.safeParse(body);

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

    // Check for duplicate name
    const existing = await prisma.postCategory.findFirst({
      where: {
        adminId: admin.id,
        name: data.name,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 409 }
      );
    }

    // Create category
    const category = await prisma.postCategory.create({
      data: {
        adminId: admin.id,
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        displayOrder: data.displayOrder ?? 0,
        active: data.active ?? true,
      },
    });

    return NextResponse.json(
      {
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
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
