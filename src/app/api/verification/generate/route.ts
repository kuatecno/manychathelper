import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  generateVerificationCode,
  validateApiKey,
  hashApiKey,
} from '@/lib/verification';

const GenerateVerificationSchema = z.object({
  external_website: z.string().min(1),
  external_user_id: z.string().optional(),
  webhook_url: z.string().url().optional(),
  callback_token: z.string().optional(),
  expires_in_minutes: z.number().int().min(1).max(60).optional().default(10),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Extract and validate API key from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid Authorization header' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Validate API key
    const { valid, apiKeyRecord, error } = await validateApiKey(apiKey);
    if (!valid || !apiKeyRecord) {
      return NextResponse.json(
        { error: error || 'Invalid API key' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = GenerateVerificationSchema.parse(body);

    // Get client IP for tracking
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Generate unique verification code
    const { code, servicePrefix, sessionId, suffix } = await generateVerificationCode(
      apiKeyRecord.servicePrefix
    );

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + validated.expires_in_minutes);

    // Create verification record
    const verification = await prisma.instagramVerification.create({
      data: {
        code,
        servicePrefix,
        sessionId,
        suffix,
        adminId: apiKeyRecord.adminId,
        externalWebsite: validated.external_website,
        externalUserId: validated.external_user_id,
        webhookUrl: validated.webhook_url,
        callbackToken: validated.callback_token,
        apiKeyUsed: hashApiKey(apiKey),
        expiresAt,
        ipAddress,
        metadata: validated.metadata ? JSON.stringify(validated.metadata) : null,
      },
    });

    // Update API key usage stats
    await prisma.verificationApiKey.update({
      where: { id: apiKeyRecord.id },
      data: {
        lastUsedAt: new Date(),
        requestCount: { increment: 1 },
      },
    });

    // Generate polling URL with session ID for security
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://flowkick.kua.cl'
      : request.headers.get('origin') || 'http://localhost:3003';
    const pollingUrl = `${baseUrl}/api/verification/check?session=${verification.id}`;

    return NextResponse.json({
      success: true,
      code: verification.code,
      session_id: verification.id,
      expires_at: verification.expiresAt.toISOString(),
      polling_url: pollingUrl,
      instructions: {
        message: `Ask user to send "${code}" via Instagram DM to your account`,
        prefix: servicePrefix,
        note: 'The code will be validated when received via Instagram DM',
      },
    });
  } catch (error) {
    console.error('Error generating verification code:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate verification code' },
      { status: 500 }
    );
  }
}
