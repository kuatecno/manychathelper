import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await params;
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    // Verify the tool belongs to this admin
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
      select: { adminId: true },
    });

    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    if (tool.adminId !== adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all conversations for this tool
    const conversations = await prisma.conversation.findMany({
      where: { toolId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        user: {
          name: `${c.user.firstName || ''} ${c.user.lastName || ''}`.trim() || 'Unknown',
          email: c.user.email || 'No email',
        },
        _count: c._count,
      })),
    });
  } catch (error) {
    console.error('Error fetching conversations for tool:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
