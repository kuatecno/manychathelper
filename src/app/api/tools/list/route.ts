import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tools/list - Returns all active tools
export async function GET(request: NextRequest) {
  try {
    const tools = await prisma.tool.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      tools,
    });
  } catch (error) {
    console.error('Error listing tools:', error);
    return NextResponse.json(
      { error: 'Failed to list tools' },
      { status: 500 }
    );
  }
}
