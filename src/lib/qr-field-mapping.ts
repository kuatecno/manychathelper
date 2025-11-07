/**
 * QR Code Field Mapping System
 *
 * Maps QR code data to Manychat custom fields for each tool
 */

import { prisma } from '@/lib/prisma';

/**
 * Available QR code fields that can be mapped
 */
export const QR_AVAILABLE_FIELDS = [
  {
    key: 'qr_code',
    label: 'QR Code',
    description: 'The actual QR code value',
    dataType: 'text',
  },
  {
    key: 'qr_type',
    label: 'QR Type',
    description: 'Type of QR code (promotion, validation, discount, etc.)',
    dataType: 'text',
  },
  {
    key: 'qr_scanned_at',
    label: 'Scan Date/Time',
    description: 'When the QR code was scanned',
    dataType: 'datetime',
  },
  {
    key: 'qr_scanned_by',
    label: 'Scanned By',
    description: 'Who scanned the QR code (admin/location)',
    dataType: 'text',
  },
  {
    key: 'qr_expires_at',
    label: 'Expiration Date',
    description: 'When the QR code expires',
    dataType: 'datetime',
  },
  {
    key: 'qr_is_valid',
    label: 'Is Valid',
    description: 'Whether the QR code is still valid',
    dataType: 'boolean',
  },
  {
    key: 'qr_campaign',
    label: 'Campaign Name',
    description: 'Campaign or promotion name from metadata',
    dataType: 'text',
  },
  {
    key: 'qr_tool_name',
    label: 'Tool Name',
    description: 'Name of the tool that generated the QR code',
    dataType: 'text',
  },
  {
    key: 'qr_created_at',
    label: 'Creation Date',
    description: 'When the QR code was created',
    dataType: 'datetime',
  },
  {
    key: 'qr_metadata',
    label: 'Full Metadata',
    description: 'All QR code metadata as JSON string',
    dataType: 'text',
  },
] as const;

export type QRFieldKey = typeof QR_AVAILABLE_FIELDS[number]['key'];

export interface QRFieldMapping {
  qrField: QRFieldKey;
  manychatFieldId: string;
  manychatFieldName: string;
  enabled: boolean;
  autoCreate?: boolean; // Auto-create field if it doesn't exist
}

export interface QRFieldMappingConfig {
  toolId: string;
  mappings: QRFieldMapping[];
  autoSyncOnScan: boolean; // Sync to Manychat when QR is scanned
  autoSyncOnValidation: boolean; // Sync to Manychat when QR is validated
}

/**
 * Get QR field mappings for a tool
 */
export async function getQRFieldMappings(toolId: string): Promise<QRFieldMappingConfig | null> {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    select: { config: true },
  });

  if (!tool || !tool.config) {
    return null;
  }

  try {
    const config = JSON.parse(tool.config);
    return config.qrFieldMapping || null;
  } catch (error) {
    console.error('Failed to parse tool config:', error);
    return null;
  }
}

/**
 * Save QR field mappings for a tool
 */
export async function saveQRFieldMappings(
  toolId: string,
  mappingConfig: Omit<QRFieldMappingConfig, 'toolId'>
): Promise<void> {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    select: { config: true },
  });

  if (!tool) {
    throw new Error('Tool not found');
  }

  // Parse existing config or create new
  let config: any = {};
  if (tool.config) {
    try {
      config = JSON.parse(tool.config);
    } catch (error) {
      console.error('Failed to parse existing config:', error);
    }
  }

  // Update QR field mapping
  config.qrFieldMapping = {
    toolId,
    ...mappingConfig,
  };

  // Save back to database
  await prisma.tool.update({
    where: { id: toolId },
    data: {
      config: JSON.stringify(config),
    },
  });
}

/**
 * Generate suggested Manychat field name from QR field
 */
export function getSuggestedFieldName(qrFieldKey: QRFieldKey): string {
  // Remove qr_ prefix and add flowkick_ prefix
  const baseKey = qrFieldKey.replace('qr_', '');
  return `flowkick_qr_${baseKey}`;
}

/**
 * Map Manychat field type from QR field data type
 */
export function getManychatFieldType(dataType: string): string {
  switch (dataType) {
    case 'text':
      return 'text';
    case 'datetime':
      return 'datetime';
    case 'boolean':
      return 'boolean';
    case 'number':
      return 'number';
    default:
      return 'text';
  }
}

/**
 * Extract QR code data for syncing to Manychat
 */
export function extractQRCodeData(qrCode: any, tool: any): Record<string, any> {
  const data: Record<string, any> = {};

  // Parse metadata if it's a string
  let metadata: any = {};
  if (qrCode.metadata) {
    try {
      metadata = typeof qrCode.metadata === 'string'
        ? JSON.parse(qrCode.metadata)
        : qrCode.metadata;
    } catch (e) {
      console.error('Failed to parse QR metadata:', e);
    }
  }

  // Map all available fields
  data['qr_code'] = qrCode.code;
  data['qr_type'] = qrCode.type;
  data['qr_scanned_at'] = qrCode.scannedAt?.toISOString() || null;
  data['qr_scanned_by'] = qrCode.scannedBy || null;
  data['qr_expires_at'] = qrCode.expiresAt?.toISOString() || null;
  data['qr_is_valid'] = qrCode.active && (!qrCode.expiresAt || new Date(qrCode.expiresAt) > new Date());
  data['qr_campaign'] = metadata.campaign || metadata.campaign_name || null;
  data['qr_tool_name'] = tool?.name || null;
  data['qr_created_at'] = qrCode.createdAt?.toISOString() || null;
  data['qr_metadata'] = qrCode.metadata || null;

  return data;
}

/**
 * Sync QR code data to Manychat custom fields
 */
export async function syncQRDataToManychat(
  userId: string,
  qrCodeId: string,
  toolId: string
): Promise<{ success: boolean; error?: string; fieldsSynced?: number }> {
  try {
    // Get user with Manychat ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { manychatId: true },
    });

    if (!user || !user.manychatId) {
      return { success: false, error: 'User not found or no Manychat ID' };
    }

    // Get QR code and tool
    const [qrCode, tool] = await Promise.all([
      prisma.qRCode.findUnique({
        where: { id: qrCodeId },
      }),
      prisma.tool.findUnique({
        where: { id: toolId },
        include: {
          admin: {
            include: {
              manychatConfig: true,
            },
          },
        },
      }),
    ]);

    if (!qrCode || !tool) {
      return { success: false, error: 'QR code or tool not found' };
    }

    if (!tool.admin?.manychatConfig?.apiToken) {
      return { success: false, error: 'Manychat not configured' };
    }

    // Get field mappings
    const mappingConfig = await getQRFieldMappings(toolId);
    if (!mappingConfig || mappingConfig.mappings.length === 0) {
      return { success: false, error: 'No field mappings configured' };
    }

    // Extract QR data
    const qrData = extractQRCodeData(qrCode, tool);

    // Prepare custom fields to update
    const customFields: Record<string, any> = {};
    let fieldsSynced = 0;

    for (const mapping of mappingConfig.mappings) {
      if (!mapping.enabled) continue;

      const value = qrData[mapping.qrField];
      if (value !== null && value !== undefined) {
        customFields[mapping.manychatFieldId] = value;
        fieldsSynced++;
      }
    }

    if (fieldsSynced === 0) {
      return { success: true, fieldsSynced: 0 };
    }

    // Update Manychat subscriber
    const apiToken = tool.admin.manychatConfig.apiToken;
    const response = await fetch(
      `https://api.manychat.com/fb/subscriber/setCustomFields`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriber_id: user.manychatId,
          fields: customFields,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: `Manychat API error: ${errorData.message || response.statusText}`,
      };
    }

    return { success: true, fieldsSynced };
  } catch (error) {
    console.error('Error syncing QR data to Manychat:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
