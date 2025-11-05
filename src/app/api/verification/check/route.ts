import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isVerificationExpired } from '@/lib/verification';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session parameter is required' },
        { status: 400 }
      );
    }

    // Find verification by session ID
    const verification = await prisma.instagramVerification.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            igUsername: true,
            instagramId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification session not found' },
        { status: 404 }
      );
    }

    // Check if expired
    const expired = isVerificationExpired(verification.expiresAt);
    if (expired && verification.status === 'pending') {
      // Update status to expired
      await prisma.instagramVerification.update({
        where: { id: verification.id },
        data: {
          status: 'expired',
          failureReason: 'Verification code expired',
        },
      });
    }

    // Parse metadata if present
    let metadata = null;
    if (verification.metadata) {
      try {
        metadata = JSON.parse(verification.metadata);
      } catch (e) {
        console.error('Failed to parse metadata:', e);
      }
    }

    // Return current status
    const response: any = {
      session_id: verification.id,
      code: verification.code,
      status: expired && verification.status === 'pending' ? 'expired' : verification.status,
      expires_at: verification.expiresAt.toISOString(),
      created_at: verification.createdAt.toISOString(),
    };

    // Add verification details if verified
    if (verification.status === 'verified') {
      response.verified_at = verification.verifiedAt?.toISOString();
      response.ig_username = verification.igUsername;

      // Include additional user info if available
      if (verification.user) {
        response.user = {
          ig_username: verification.user.igUsername,
          instagram_id: verification.user.instagramId,
          first_name: verification.user.firstName,
          last_name: verification.user.lastName,
          full_name: `${verification.user.firstName || ''} ${verification.user.lastName || ''}`.trim(),
        };
      }

      // Include metadata if present
      if (metadata) {
        response.metadata = metadata;
      }
    }

    // Add failure reason if failed
    if (verification.status === 'failed') {
      response.failure_reason = verification.failureReason;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error checking verification:', error);
    return NextResponse.json(
      { error: 'Failed to check verification status' },
      { status: 500 }
    );
  }
}
