import { NextRequest, NextResponse } from 'next/server';
import { createSyncService } from '@/lib/manychat-sync';
import { z } from 'zod';

const SyncContactSchema = z.object({
  admin_id: z.string(),
  subscriber_id: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = SyncContactSchema.parse(body);

    // Create sync service
    const syncService = await createSyncService(validated.admin_id);

    if (!syncService) {
      return NextResponse.json(
        { error: 'Manychat configuration not found or inactive' },
        { status: 404 }
      );
    }

    // Create sync log
    const logId = await syncService.createSyncLog('webhook', 'in_progress');

    try {
      // Sync subscriber
      const result = await syncService.syncSubscriber(validated.subscriber_id);

      // Update sync log
      await syncService.updateSyncLog(
        logId,
        result.success ? 'completed' : 'failed',
        result
      );

      return NextResponse.json({
        success: result.success,
        contact_id: result.userId,
        synced: result.recordsSynced,
        failed: result.recordsFailed,
        errors: result.errors,
        log_id: logId,
      });
    } catch (error) {
      // Update log as failed
      await syncService.updateSyncLog(logId, 'failed', {
        success: false,
        recordsSynced: 0,
        recordsFailed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
      throw error;
    }
  } catch (error) {
    console.error('Sync contact error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
