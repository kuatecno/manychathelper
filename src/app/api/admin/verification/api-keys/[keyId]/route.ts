import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get specific API key details
export async function GET(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const apiKey = await prisma.verificationApiKey.findUnique({
      where: { id: params.keyId },
      select: {
        id: true,
        name: true,
        websiteDomain: true,
        servicePrefix: true,
        active: true,
        maxRequestsPerHour: true,
        maxRequestsPerDay: true,
        lastUsedAt: true,
        requestCount: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Parse metadata
    let metadata = null;
    if (apiKey.metadata) {
      try {
        metadata = JSON.parse(apiKey.metadata);
      } catch (e) {
        console.error('Failed to parse metadata:', e);
      }
    }

    return NextResponse.json({
      api_key: {
        ...apiKey,
        metadata,
      },
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API key' },
      { status: 500 }
    );
  }
}

// PUT - Update API key
export async function PUT(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    const body = await request.json();
    const { active, name, max_requests_per_hour, max_requests_per_day, metadata } = body;

    const updateData: any = {};
    if (typeof active === 'boolean') updateData.active = active;
    if (name) updateData.name = name;
    if (max_requests_per_hour) updateData.maxRequestsPerHour = max_requests_per_hour;
    if (max_requests_per_day) updateData.maxRequestsPerDay = max_requests_per_day;
    if (metadata) updateData.metadata = JSON.stringify(metadata);

    const apiKey = await prisma.verificationApiKey.update({
      where: { id: params.keyId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      api_key: {
        id: apiKey.id,
        name: apiKey.name,
        active: apiKey.active,
        updated_at: apiKey.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

// DELETE - Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: { keyId: string } }
) {
  try {
    await prisma.verificationApiKey.delete({
      where: { id: params.keyId },
    });

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
