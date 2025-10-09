import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/helpers/list - Returns all active helpers
export async function GET(request: NextRequest) {
  try {
    const helpers = await prisma.helper.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      helpers,
    });
  } catch (error) {
    console.error('Error listing helpers:', error);
    return NextResponse.json(
      { error: 'Failed to list helpers' },
      { status: 500 }
    );
  }
}
