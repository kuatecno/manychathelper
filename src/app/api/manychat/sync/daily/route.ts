import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSyncService } from '@/lib/manychat-sync';

/**
 * Daily sync cron job endpoint
 * Configure in vercel.json or call from external cron service
 * Syncs all contacts that haven't been synced in 24 hours
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results = {
      success: true,
      synced: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Get all active Manychat configurations
    const configs = await prisma.manychatConfig.findMany({
      where: { active: true },
      include: {
        admin: true,
      },
    });

    for (const config of configs) {
      try {
        const syncService = await createSyncService(config.adminId);

        if (!syncService) {
          results.errors.push(`Failed to create sync service for admin ${config.adminId}`);
          continue;
        }

        // Get contacts that need syncing (not synced in 24 hours or never synced)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const contacts = await prisma.user.findMany({
          where: {
            manychatId: { not: null },
            OR: [
              { lastSyncedAt: null },
              { lastSyncedAt: { lt: dayAgo } },
            ],
          },
          select: {
            id: true,
            manychatId: true,
            lastSyncedAt: true,
          },
          take: 100, // Limit to avoid rate limits
        });

        for (const contact of contacts) {
          if (!contact.manychatId) {
            results.skipped++;
            continue;
          }

          try {
            const result = await syncService.syncSubscriber(Number(contact.manychatId));

            if (result.success) {
              results.synced++;
            } else {
              results.failed++;
              results.errors.push(...result.errors);
            }

            // Add small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            results.failed++;
            results.errors.push(
              `Contact ${contact.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        results.errors.push(
          `Config ${config.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return NextResponse.json({
      success: results.failed === 0,
      synced: results.synced,
      failed: results.failed,
      skipped: results.skipped,
      errors: results.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Daily sync error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Daily sync failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
