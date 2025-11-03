import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toolName, newAdminId, secretKey } = body;

    // Simple security check - use a temporary secret
    if (secretKey !== 'transfer-ownership-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!toolName || !newAdminId) {
      return NextResponse.json(
        { error: 'toolName and newAdminId are required' },
        { status: 400 }
      );
    }

    // Find the tool
    const tool = await prisma.tool.findFirst({
      where: { name: toolName },
      select: { id: true, name: true, adminId: true, type: true },
    });

    if (!tool) {
      return NextResponse.json(
        { error: `Tool "${toolName}" not found` },
        { status: 404 }
      );
    }

    // Update the tool's admin
    const updated = await prisma.tool.update({
      where: { id: tool.id },
      data: { adminId: newAdminId },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully transferred ownership of "${updated.name}"`,
      tool: {
        id: updated.id,
        name: updated.name,
        type: updated.type,
        previousAdminId: tool.adminId,
        newAdminId: updated.adminId,
      },
    });
  } catch (error) {
    console.error('Error transferring tool ownership:', error);
    return NextResponse.json(
      { error: 'Failed to transfer ownership', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
