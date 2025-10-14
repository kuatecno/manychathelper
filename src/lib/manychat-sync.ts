/**
 * Manychat Sync Service
 * Handles synchronization of Manychat data to local database
 */

import { prisma } from './prisma';
import { ManychatClient, ManychatSubscriber, ManychatTag, ManychatCustomField } from './manychat-client';

export interface SyncResult {
  success: boolean;
  recordsSynced: number;
  recordsFailed: number;
  errors: string[];
  userId?: string;
}

export class ManychatSyncService {
  private client: ManychatClient;
  private adminId: string;
  private configId: string;

  constructor(pageId: string, apiToken: string, adminId: string, configId: string) {
    // Combine pageId and apiToken in the format required by Manychat API
    const fullToken = `${pageId}:${apiToken}`;
    this.client = new ManychatClient(fullToken);
    this.adminId = adminId;
    this.configId = configId;
  }

  /**
   * Sync all tags from Manychat
   */
  async syncTags(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      recordsSynced: 0,
      recordsFailed: 0,
      errors: [],
    };

    try {
      const response = await this.client.getTags();
      const tags = response.data;

      for (const tag of tags) {
        try {
          await prisma.tag.upsert({
            where: {
              adminId_manychatTagId: {
                adminId: this.adminId,
                manychatTagId: String(tag.id),
              },
            },
            create: {
              adminId: this.adminId,
              manychatTagId: String(tag.id),
              name: tag.name,
            },
            update: {
              name: tag.name,
            },
          });
          result.recordsSynced++;
        } catch (error) {
          result.recordsFailed++;
          result.errors.push(`Failed to sync tag ${tag.name}: ${error}`);
        }
      }

      result.success = result.recordsFailed === 0;
    } catch (error) {
      result.errors.push(`Failed to fetch tags: ${error}`);
    }

    return result;
  }

  /**
   * Sync all custom fields from Manychat
   */
  async syncCustomFields(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      recordsSynced: 0,
      recordsFailed: 0,
      errors: [],
    };

    try {
      const response = await this.client.getCustomFields();
      const fields = response.data;

      for (const field of fields) {
        try {
          await prisma.customField.upsert({
            where: {
              adminId_manychatFieldId: {
                adminId: this.adminId,
                manychatFieldId: String(field.id),
              },
            },
            create: {
              adminId: this.adminId,
              manychatFieldId: String(field.id),
              name: field.name,
              type: field.type,
            },
            update: {
              name: field.name,
              type: field.type,
            },
          });
          result.recordsSynced++;
        } catch (error) {
          result.recordsFailed++;
          result.errors.push(`Failed to sync field ${field.name}: ${error}`);
        }
      }

      result.success = result.recordsFailed === 0;
    } catch (error) {
      result.errors.push(`Failed to fetch custom fields: ${error}`);
    }

    return result;
  }

  /**
   * Sync a single subscriber from Manychat
   */
  async syncSubscriber(subscriberId: number): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      recordsSynced: 0,
      recordsFailed: 0,
      errors: [],
    };

    try {
      const response = await this.client.getSubscriberInfo(subscriberId);
      const subscriber = response.data;

      const userId = await this.upsertSubscriber(subscriber);
      result.recordsSynced++;
      result.success = true;
      result.userId = userId;
    } catch (error) {
      result.recordsFailed++;
      result.errors.push(`Failed to sync subscriber ${subscriberId}: ${error}`);
    }

    return result;
  }

  /**
   * Upsert subscriber data to database
   */
  private async upsertSubscriber(subscriber: ManychatSubscriber): Promise<string> {
    // Infer Instagram opt-in from presence of ig_id or ig_username
    const hasInstagram = !!(subscriber.ig_id || subscriber.ig_username);

    // Upsert user
    const user = await prisma.user.upsert({
      where: { manychatId: String(subscriber.id) },
      create: {
        manychatId: String(subscriber.id),
        instagramId: subscriber.ig_id ? String(subscriber.ig_id) : null,
        igUsername: subscriber.ig_username || null,
        firstName: subscriber.first_name || null,
        lastName: subscriber.last_name || null,
        email: subscriber.email || null,
        phone: subscriber.phone || null,
        whatsappPhone: subscriber.whatsapp_phone || null,
        gender: subscriber.gender || null,
        locale: subscriber.locale || null,
        timezone: subscriber.timezone ? String(subscriber.timezone) : null,
        profilePic: subscriber.profile_pic || null,
        optedInMessenger: subscriber.opted_in_messenger || false,
        optedInInstagram: subscriber.opted_in_instagram || hasInstagram,
        optedInWhatsapp: subscriber.optin_whatsapp || subscriber.opted_in_whatsapp || false,
        optedInTelegram: subscriber.opted_in_telegram || false,
        subscribedAt: subscriber.subscribed ? new Date(subscriber.subscribed) : null,
        lastTextInput: subscriber.last_input_text || null,
        lastSyncedAt: new Date(),
      },
      update: {
        instagramId: subscriber.ig_id ? String(subscriber.ig_id) : null,
        igUsername: subscriber.ig_username || null,
        firstName: subscriber.first_name || null,
        lastName: subscriber.last_name || null,
        email: subscriber.email || null,
        phone: subscriber.phone || null,
        whatsappPhone: subscriber.whatsapp_phone || null,
        gender: subscriber.gender || null,
        locale: subscriber.locale || null,
        timezone: subscriber.timezone ? String(subscriber.timezone) : null,
        profilePic: subscriber.profile_pic || null,
        optedInMessenger: subscriber.opted_in_messenger || false,
        optedInInstagram: subscriber.opted_in_instagram || hasInstagram,
        optedInWhatsapp: subscriber.optin_whatsapp || subscriber.opted_in_whatsapp || false,
        optedInTelegram: subscriber.opted_in_telegram || false,
        subscribedAt: subscriber.subscribed ? new Date(subscriber.subscribed) : null,
        lastTextInput: subscriber.last_input_text || null,
        lastSyncedAt: new Date(),
      },
    });

    // Sync tags
    if (subscriber.tags && subscriber.tags.length > 0) {
      // First, remove all existing tags for this user
      await prisma.contactTag.deleteMany({
        where: { userId: user.id },
      });

      // Then add current tags
      for (const tag of subscriber.tags) {
        // Find or create tag
        const dbTag = await prisma.tag.upsert({
          where: {
            adminId_manychatTagId: {
              adminId: this.adminId,
              manychatTagId: String(tag.id),
            },
          },
          create: {
            adminId: this.adminId,
            manychatTagId: String(tag.id),
            name: tag.name,
          },
          update: {
            name: tag.name,
          },
        });

        // Create contact tag association
        await prisma.contactTag.create({
          data: {
            userId: user.id,
            tagId: dbTag.id,
          },
        });
      }
    }

    // Sync custom fields and track interaction counts
    let messagesCount = 0;
    let commentsCount = 0;
    let storiesCount = 0;

    if (subscriber.custom_fields && subscriber.custom_fields.length > 0) {
      for (const field of subscriber.custom_fields) {
        // Find custom field definition
        const dbField = await prisma.customField.findUnique({
          where: {
            adminId_manychatFieldId: {
              adminId: this.adminId,
              manychatFieldId: String(field.id),
            },
          },
        });

        if (dbField) {
          // Store value as JSON string
          const valueStr = field.value !== null && field.value !== undefined
            ? JSON.stringify(field.value)
            : null;

          await prisma.customFieldValue.upsert({
            where: {
              userId_fieldId: {
                userId: user.id,
                fieldId: dbField.id,
              },
            },
            create: {
              userId: user.id,
              fieldId: dbField.id,
              value: valueStr,
            },
            update: {
              value: valueStr,
            },
          });

          // Track interaction counts from special custom fields
          if (field.name === 'messagescountinsta' && typeof field.value === 'number') {
            messagesCount = field.value;
          } else if (field.name === 'commentcountinsta' && typeof field.value === 'number') {
            commentsCount = field.value;
          } else if (field.name === 'storiescountinsta' && typeof field.value === 'number') {
            storiesCount = field.value;
          }
        }
      }
    }

    // Create interaction history snapshot (daily)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalCount = messagesCount + commentsCount + storiesCount;

    // Only create snapshot if there are interactions
    if (totalCount > 0) {
      await prisma.interactionHistory.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: today,
          },
        },
        create: {
          userId: user.id,
          date: today,
          messagesCount,
          commentsCount,
          storiesCount,
          totalCount,
        },
        update: {
          messagesCount,
          commentsCount,
          storiesCount,
          totalCount,
        },
      });
    }

    // Create user snapshot (every sync)
    // Get all custom fields for this user
    const allCustomFields = await prisma.customFieldValue.findMany({
      where: { userId: user.id },
      include: {
        field: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    const customFieldsSnapshot = allCustomFields.map((cf) => ({
      name: cf.field.name,
      type: cf.field.type,
      value: cf.value ? JSON.parse(cf.value) : null,
    }));

    // Get all tags for this user
    const allTags = await prisma.contactTag.findMany({
      where: { userId: user.id },
      include: {
        tag: {
          select: {
            name: true,
            manychatTagId: true,
          },
        },
      },
    });

    const tagsSnapshot = allTags.map((ct) => ({
      name: ct.tag.name,
      manychatTagId: ct.tag.manychatTagId,
    }));

    // Create snapshot
    await prisma.userSnapshot.create({
      data: {
        userId: user.id,
        firstName: subscriber.first_name || null,
        lastName: subscriber.last_name || null,
        igUsername: subscriber.ig_username || null,
        email: subscriber.email || null,
        phone: subscriber.phone || null,
        whatsappPhone: subscriber.whatsapp_phone || null,
        timezone: subscriber.timezone ? String(subscriber.timezone) : null,
        profilePic: subscriber.profile_pic || null,
        customFieldsData: JSON.stringify(customFieldsSnapshot),
        tagsData: JSON.stringify(tagsSnapshot),
      },
    });

    return user.id;
  }

  /**
   * Create a sync log entry
   */
  async createSyncLog(
    syncType: string,
    status: string,
    result?: SyncResult
  ): Promise<string> {
    const log = await prisma.syncLog.create({
      data: {
        configId: this.configId,
        syncType,
        status,
        recordsSynced: result?.recordsSynced || 0,
        recordsFailed: result?.recordsFailed || 0,
        errorMessage: result?.errors.join('\n') || null,
        completedAt: status === 'completed' || status === 'failed' ? new Date() : null,
      },
    });

    return log.id;
  }

  /**
   * Update sync log
   */
  async updateSyncLog(
    logId: string,
    status: string,
    result?: SyncResult
  ): Promise<void> {
    await prisma.syncLog.update({
      where: { id: logId },
      data: {
        status,
        recordsSynced: result?.recordsSynced || 0,
        recordsFailed: result?.recordsFailed || 0,
        errorMessage: result?.errors.join('\n') || null,
        completedAt: status === 'completed' || status === 'failed' ? new Date() : null,
      },
    });
  }
}

/**
 * Create sync service instance from admin ID
 */
export async function createSyncService(adminId: string): Promise<ManychatSyncService | null> {
  const config = await prisma.manychatConfig.findUnique({
    where: { adminId },
  });

  if (!config || !config.active) {
    return null;
  }

  // Extract pageId from stored value or from apiToken
  let pageId = config.pageId;
  let apiToken = config.apiToken;

  // If pageId is not set but apiToken contains it (format: pageId:token)
  if (!pageId && apiToken.includes(':')) {
    [pageId, apiToken] = apiToken.split(':', 2);
  }

  // If we still don't have a pageId, the config is invalid
  if (!pageId) {
    return null;
  }

  return new ManychatSyncService(pageId, apiToken, adminId, config.id);
}
