import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  parseVerificationCode,
  isVerificationExpired,
  sendWebhookNotification,
} from '@/lib/verification';

const ValidateVerificationSchema = z.object({
  code: z.string().min(1),
  ig_username: z.string().min(1),
  manychat_user_id: z.string().min(1),
  instagram_id: z.string().optional(),
  subscriber_data: z.any().optional(), // Full Manychat subscriber data
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ValidateVerificationSchema.parse(body);

    // Parse the verification code
    const parsedCode = parseVerificationCode(validated.code);
    if (!parsedCode) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Invalid code format. Please send the code exactly as shown.',
          error: 'INVALID_FORMAT',
        },
        { status: 400 }
      );
    }

    // Find the verification record
    const verification = await prisma.instagramVerification.findUnique({
      where: { code: validated.code },
      include: {
        admin: {
          include: {
            manychatConfig: true,
          },
        },
      },
    });

    if (!verification) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Code not found. Please request a new code.',
          error: 'CODE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Check if already verified
    if (verification.status === 'verified') {
      return NextResponse.json(
        {
          valid: false,
          message: 'This code has already been used.',
          error: 'ALREADY_USED',
          verified_at: verification.verifiedAt?.toISOString(),
        },
        { status: 400 }
      );
    }

    // Check if expired
    if (isVerificationExpired(verification.expiresAt)) {
      await prisma.instagramVerification.update({
        where: { id: verification.id },
        data: {
          status: 'expired',
          failureReason: 'Code expired',
        },
      });

      return NextResponse.json(
        {
          valid: false,
          message: 'This code has expired. Please request a new code.',
          error: 'EXPIRED',
          expired_at: verification.expiresAt.toISOString(),
        },
        { status: 400 }
      );
    }

    // Check if failed (max attempts exceeded)
    if (verification.status === 'failed') {
      return NextResponse.json(
        {
          valid: false,
          message: 'This code has been invalidated.',
          error: 'FAILED',
          failure_reason: verification.failureReason,
        },
        { status: 400 }
      );
    }

    // Increment attempt count
    await prisma.instagramVerification.update({
      where: { id: verification.id },
      data: {
        attemptCount: { increment: 1 },
      },
    });

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { manychatId: validated.manychat_user_id },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          manychatId: validated.manychat_user_id,
          igUsername: validated.ig_username,
          instagramId: validated.instagram_id,
          // Extract additional data from subscriber_data if provided
          firstName: validated.subscriber_data?.first_name,
          lastName: validated.subscriber_data?.last_name,
          profilePic: validated.subscriber_data?.profile_pic,
          optedInInstagram: true,
        },
      });
    } else {
      // Update existing user with latest Instagram info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          igUsername: validated.ig_username,
          instagramId: validated.instagram_id || user.instagramId,
          firstName: validated.subscriber_data?.first_name || user.firstName,
          lastName: validated.subscriber_data?.last_name || user.lastName,
          profilePic: validated.subscriber_data?.profile_pic || user.profilePic,
          optedInInstagram: true,
        },
      });
    }

    // Mark verification as successful
    const updatedVerification = await prisma.instagramVerification.update({
      where: { id: verification.id },
      data: {
        status: 'verified',
        userId: user.id,
        igUsername: validated.ig_username,
        instagramId: validated.instagram_id,
        manychatUserId: validated.manychat_user_id,
        verifiedAt: new Date(),
        dmReceivedAt: new Date(),
      },
    });

    // Prepare response
    const response = {
      valid: true,
      message: '✅ Verification successful! Your Instagram account has been linked.',
      verification_id: updatedVerification.id,
      ig_username: validated.ig_username,
      verified_at: updatedVerification.verifiedAt?.toISOString(),
      external_website: verification.externalWebsite,
      external_user_id: verification.externalUserId,
    };

    // Send webhook notification to external site if configured
    if (verification.webhookUrl) {
      const webhookPayload = {
        event: 'verification.success',
        verification_id: updatedVerification.id,
        code: updatedVerification.code,
        external_website: verification.externalWebsite,
        external_user_id: verification.externalUserId,
        ig_username: validated.ig_username,
        instagram_id: validated.instagram_id,
        manychat_user_id: validated.manychat_user_id,
        user: {
          first_name: user.firstName,
          last_name: user.lastName,
          full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          profile_pic: user.profilePic,
        },
        verified_at: updatedVerification.verifiedAt?.toISOString(),
        metadata: verification.metadata ? JSON.parse(verification.metadata) : null,
      };

      // Send webhook in background (don't wait for response)
      sendWebhookNotification(
        verification.webhookUrl,
        webhookPayload,
        verification.callbackToken || undefined
      ).catch((error) => {
        console.error('Failed to send webhook notification:', error);
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error validating verification code:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          valid: false,
          message: 'Invalid request format.',
          error: 'INVALID_REQUEST',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        valid: false,
        message: 'An error occurred during validation.',
        error: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
