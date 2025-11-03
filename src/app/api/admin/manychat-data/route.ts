import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adminId = searchParams.get('admin_id');

    if (!adminId) {
      return NextResponse.json(
        { error: 'admin_id parameter is required' },
        { status: 400 }
      );
    }

    // Fetch tags for this admin
    const tags = await prisma.tag.findMany({
      where: { adminId },
      select: {
        id: true,
        manychatTagId: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    // Fetch custom fields for this admin
    const customFields = await prisma.customField.findMany({
      where: { adminId },
      select: {
        id: true,
        manychatFieldId: true,
        name: true,
        type: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      tags,
      customFields,
    });
  } catch (error) {
    console.error('Error fetching Manychat data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Manychat data' },
      { status: 500 }
    );
  }
}
