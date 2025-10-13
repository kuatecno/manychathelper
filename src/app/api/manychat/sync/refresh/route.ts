import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSyncService } from '@/lib/manychat-sync';
import { z } from 'zod';

const RefreshSchema = z.object({
  admin_id: z.string(),
  contact_id: z.string().optional(),
  refresh_all: z.boolean().optional(),
});

/**
 * Manual refresh endpoint - fetches full contact data from Manychat
 * Can refresh a single contact or all contacts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RefreshSchema.parse(body);

    // Create sync service
    const syncService = await createSyncService(validated.admin_id);

    if (!syncService) {
      return NextResponse.json(
        { error: 'Manychat configuration not found or inactive' },
        { status: 404 }
      );
    }

    const results = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Refresh all contacts
    if (validated.refresh_all) {
      const contacts = await prisma.user.findMany({
        select: {
          id: true,
          manychatId: true,
        },
      });

      for (const contact of contacts) {

        try {
          const result = await syncService.syncSubscriber(Number(contact.manychatId));
          if (result.success) {
            results.synced++;
          } else {
            results.failed++;
            results.errors.push(...result.errors);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Contact ${contact.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return NextResponse.json({
        success: results.failed === 0,
        synced: results.synced,
        failed: results.failed,
        total: contacts.length,
        errors: results.errors,
      });
    }

    // Refresh single contact
    if (validated.contact_id) {
      const contact = await prisma.user.findUnique({
        where: { id: validated.contact_id },
        select: { manychatId: true },
      });

      if (!contact || !contact.manychatId) {
        return NextResponse.json(
          { error: 'Contact not found or missing Manychat ID' },
          { status: 404 }
        );
      }

      const result = await syncService.syncSubscriber(Number(contact.manychatId));

      return NextResponse.json({
        success: result.success,
        synced: result.recordsSynced,
        failed: result.recordsFailed,
        errors: result.errors,
      });
    }

    return NextResponse.json(
      { error: 'Either contact_id or refresh_all must be provided' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Refresh error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Refresh failed' },
      { status: 500 }
    );
  }
}
