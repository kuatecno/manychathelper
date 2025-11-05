import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateFlowkickApiKey, hashApiKey } from '@/lib/flowkick';

// Validation schemas
const CreateClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']).default('free'),
  instagramHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
  googlePlaceId: z.string().optional(),
  twitterHandle: z.string().optional(),
  youtubeChannelId: z.string().optional(),
  facebookPageId: z.string().optional(),
  cacheRefreshInterval: z.number().int().min(5).max(120).default(30),
});

const UpdateClientSchema = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
  plan: z.enum(['free', 'starter', 'pro', 'enterprise']).optional(),
  instagramHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
  googlePlaceId: z.string().optional(),
  twitterHandle: z.string().optional(),
  youtubeChannelId: z.string().optional(),
  facebookPageId: z.string().optional(),
  cacheRefreshInterval: z.number().int().min(5).max(120).optional(),
  monthlyRequestsLimit: z.number().int().min(0).optional(),
});

// Plan limits
const PLAN_LIMITS = {
  free: 1000,
  starter: 10000,
  pro: 100000,
  enterprise: 1000000,
};

/**
 * GET /api/v1/admin/flowkick-clients
 * List all Flowkick clients
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication

    const clients = await prisma.flowkickClient.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            socialMediaCache: true,
            apiUsage: true,
          },
        },
      },
    });

    // Don't return sensitive data
    const clientsFormatted = clients.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      apiKeyPreview: client.apiKey.substring(0, 12) + '...',
      active: client.active,
      plan: client.plan,
      monthlyRequestsUsed: client.monthlyRequestsUsed,
      monthlyRequestsLimit: client.monthlyRequestsLimit,
      platforms: {
        instagram: !!client.instagramHandle,
        tiktok: !!client.tiktokHandle,
        googleMaps: !!client.googlePlaceId,
        twitter: !!client.twitterHandle,
        youtube: !!client.youtubeChannelId,
        facebook: !!client.facebookPageId,
      },
      totalCaches: client._count.socialMediaCache,
      totalRequests: client._count.apiUsage,
      lastRequestAt: client.lastRequestAt,
      createdAt: client.createdAt,
    }));

    return NextResponse.json({
      success: true,
      clients: clientsFormatted,
    });
  } catch (error) {
    console.error('Error fetching Flowkick clients:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch clients',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/admin/flowkick-clients
 * Create a new Flowkick client
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication

    const body = await request.json();
    const validated = CreateClientSchema.parse(body);

    // Generate API key
    const rawApiKey = generateFlowkickApiKey();
    const hashedApiKey = hashApiKey(rawApiKey);

    // Set monthly limit based on plan
    const monthlyRequestsLimit = PLAN_LIMITS[validated.plan];

    // Create client
    const client = await prisma.flowkickClient.create({
      data: {
        name: validated.name,
        email: validated.email,
        apiKey: hashedApiKey,
        plan: validated.plan,
        monthlyRequestsLimit,
        requestsResetAt: getNextMonthResetDate(),
        instagramHandle: validated.instagramHandle,
        tiktokHandle: validated.tiktokHandle,
        googlePlaceId: validated.googlePlaceId,
        twitterHandle: validated.twitterHandle,
        youtubeChannelId: validated.youtubeChannelId,
        facebookPageId: validated.facebookPageId,
        cacheRefreshInterval: validated.cacheRefreshInterval,
      },
    });

    // Return client details with raw API key (only shown once!)
    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        apiKey: rawApiKey, // ⚠️ ONLY SHOWN ONCE!
        plan: client.plan,
        monthlyRequestsLimit: client.monthlyRequestsLimit,
        platforms: {
          instagram: validated.instagramHandle,
          tiktok: validated.tiktokHandle,
          googleMaps: validated.googlePlaceId,
          twitter: validated.twitterHandle,
          youtube: validated.youtubeChannelId,
          facebook: validated.facebookPageId,
        },
        createdAt: client.createdAt,
      },
      warning: 'Save this API key now! It will not be shown again.',
    });
  } catch (error) {
    console.error('Error creating Flowkick client:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to create client',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/admin/flowkick-clients/{clientId}
 * Update a Flowkick client
 */
export async function PATCH(request: NextRequest) {
  try {
    // TODO: Add admin authentication

    const clientId = request.nextUrl.searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId parameter' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = UpdateClientSchema.parse(body);

    // If plan is changing, update monthly limit
    const updateData: any = { ...validated };
    if (validated.plan) {
      updateData.monthlyRequestsLimit = PLAN_LIMITS[validated.plan];
    }

    const client = await prisma.flowkickClient.update({
      where: { id: clientId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        active: client.active,
        plan: client.plan,
        monthlyRequestsLimit: client.monthlyRequestsLimit,
        platforms: {
          instagram: client.instagramHandle,
          tiktok: client.tiktokHandle,
          googleMaps: client.googlePlaceId,
          twitter: client.twitterHandle,
          youtube: client.youtubeChannelId,
          facebook: client.facebookPageId,
        },
        updatedAt: client.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating Flowkick client:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update client',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/flowkick-clients/{clientId}
 * Delete a Flowkick client
 */
export async function DELETE(request: NextRequest) {
  try {
    // TODO: Add admin authentication

    const clientId = request.nextUrl.searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json(
        { error: 'Missing clientId parameter' },
        { status: 400 }
      );
    }

    await prisma.flowkickClient.delete({
      where: { id: clientId },
    });

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting Flowkick client:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete client',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Helper: Get next month reset date
 */
function getNextMonthResetDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}
