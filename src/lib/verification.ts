import { prisma } from './prisma';
import crypto from 'crypto';

/**
 * Generate a random 3-character alphanumeric prefix
 * This makes it harder for external parties to guess verification codes
 */
function generateServicePrefix(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomBytes = crypto.randomBytes(3);
  let result = '';

  for (let i = 0; i < 3; i++) {
    result += chars[randomBytes[i] % chars.length];
  }

  return result;
}

/**
 * Generate a random alphanumeric string
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }

  return result;
}

/**
 * Generate a unique verification code with random prefix
 * Format: PREFIX-SESSION-SUFFIX
 * Example: X7K-73-ABC
 *
 * The prefix is now randomized for each code to prevent external parties from guessing codes
 *
 * @param sessionIdLength - Length of session ID (default: 2)
 * @param suffixLength - Length of random suffix (default: 3)
 */
export async function generateVerificationCode(
  sessionIdLength: number = 2,
  suffixLength: number = 3
): Promise<{ code: string; servicePrefix: string; sessionId: string; suffix: string }> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const servicePrefix = generateServicePrefix(); // Generate random prefix for each code
    const sessionId = generateRandomString(sessionIdLength);
    const suffix = generateRandomString(suffixLength);
    const code = `${servicePrefix}-${sessionId}-${suffix}`;

    // Check if code already exists
    const existing = await prisma.instagramVerification.findUnique({
      where: { code },
    });

    if (!existing) {
      return {
        code,
        servicePrefix,
        sessionId,
        suffix,
      };
    }

    attempts++;
  }

  throw new Error('Failed to generate unique verification code after maximum attempts');
}

/**
 * Validate API key and check rate limits
 */
export async function validateApiKey(apiKey: string): Promise<{
  valid: boolean;
  apiKeyRecord?: any;
  error?: string;
}> {
  // Hash the API key for lookup
  const hashedKey = crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');

  const apiKeyRecord = await prisma.verificationApiKey.findUnique({
    where: { apiKey: hashedKey },
    include: { admin: true },
  });

  if (!apiKeyRecord) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (!apiKeyRecord.active) {
    return { valid: false, error: 'API key is inactive' };
  }

  // Check rate limits (simplified - in production use Redis)
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentVerifications = await prisma.instagramVerification.count({
    where: {
      apiKeyUsed: hashedKey,
      createdAt: { gte: hourAgo },
    },
  });

  if (recentVerifications >= apiKeyRecord.maxRequestsPerHour) {
    return { valid: false, error: 'Hourly rate limit exceeded' };
  }

  return { valid: true, apiKeyRecord };
}

/**
 * Generate a hash for API key storage
 */
export function hashApiKey(apiKey: string): string {
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  return `fk_${crypto.randomBytes(32).toString('hex')}`;
}

/**
 * Generate HMAC signature for webhook callbacks
 */
export function generateWebhookSignature(
  payload: any,
  secret: string
): string {
  const payloadString = JSON.stringify(payload);
  return crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: any,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Check if verification code is expired
 */
export function isVerificationExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}

/**
 * Clean up expired verifications (run periodically)
 */
export async function cleanupExpiredVerifications(): Promise<number> {
  const result = await prisma.instagramVerification.updateMany({
    where: {
      expiresAt: { lt: new Date() },
      status: 'pending',
    },
    data: {
      status: 'expired',
      failureReason: 'Verification code expired',
    },
  });

  return result.count;
}

/**
 * Parse verification code into components
 */
export function parseVerificationCode(code: string): {
  servicePrefix: string;
  sessionId: string;
  suffix: string;
} | null {
  const parts = code.split('-');

  if (parts.length !== 3) {
    return null;
  }

  return {
    servicePrefix: parts[0],
    sessionId: parts[1],
    suffix: parts[2],
  };
}

/**
 * Send webhook notification to external site
 */
export async function sendWebhookNotification(
  webhookUrl: string,
  payload: any,
  callbackToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Flowkick-Verification/1.0',
    };

    // Add signature if callback token is provided
    if (callbackToken) {
      const signature = generateWebhookSignature(payload, callbackToken);
      headers['X-Flowkick-Signature'] = signature;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Webhook returned status ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
