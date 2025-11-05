import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateApiKey, hashApiKey, SERVICE_PREFIXES } from '@/lib/verification';

const CreateApiKeySchema = z.object({
  name: z.string().min(1),
  website_domain: z.string().min(1),
  service_prefix: z.string().min(3).max(3),
  max_requests_per_hour: z.number().int().min(1).max(10000).optional().default(100),
  max_requests_per_day: z.number().int().min(1).max(100000).optional().default(1000),
  metadata: z.record(z.string(), z.any()).optional(),
});

// GET - List all API keys for an admin
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json(
        { error: 'adminId parameter is required' },
        { status: 400 }
      );
    }

    // Verify admin exists
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Get all API keys for this admin
    const apiKeys = await prisma.verificationApiKey.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
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
        createdAt: true,
        updatedAt: true,
        // Don't return the actual API key
      },
    });

    return NextResponse.json({ api_keys: apiKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

// POST - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, ...data } = body;

    if (!adminId) {
      return NextResponse.json(
        { error: 'adminId is required' },
        { status: 400 }
      );
    }

    // Verify admin exists
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Validate request data
    const validated = CreateApiKeySchema.parse(data);

    // Generate a new API key
    const rawApiKey = generateApiKey();
    const hashedKey = hashApiKey(rawApiKey);

    // Create the API key record
    const apiKey = await prisma.verificationApiKey.create({
      data: {
        adminId,
        name: validated.name,
        apiKey: hashedKey,
        websiteDomain: validated.website_domain,
        servicePrefix: validated.service_prefix,
        maxRequestsPerHour: validated.max_requests_per_hour,
        maxRequestsPerDay: validated.max_requests_per_day,
        metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
      },
    });

    // Return the API key details including the raw key (only shown once)
    return NextResponse.json({
      success: true,
      api_key: {
        id: apiKey.id,
        name: apiKey.name,
        website_domain: apiKey.websiteDomain,
        service_prefix: apiKey.servicePrefix,
        key: rawApiKey, // IMPORTANT: Only shown once!
        created_at: apiKey.createdAt.toISOString(),
      },
      warning: 'Save this API key now. You will not be able to see it again!',
    });
  } catch (error) {
    console.error('Error creating API key:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
