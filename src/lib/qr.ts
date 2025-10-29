import QRCode from 'qrcode';
import { ManychatSubscriber } from './manychat-client';

export interface QRAppearanceSettings {
  width: number;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  darkColor: string;
  lightColor: string;
}

export interface QRFormatSettings {
  prefix: string;
  includeUserId: boolean;
  includeTimestamp: boolean;
  includeRandom: boolean;
  customFormat: string;
}

const defaultAppearance: QRAppearanceSettings = {
  width: 300,
  margin: 2,
  errorCorrectionLevel: 'H',
  darkColor: '#000000',
  lightColor: '#FFFFFF',
};

const defaultFormat: QRFormatSettings = {
  prefix: 'QR',
  includeUserId: true,
  includeTimestamp: true,
  includeRandom: true,
  customFormat: '{PREFIX}-{USER_ID}-{TIMESTAMP}-{RANDOM}',
};

export async function generateQRCodeDataURL(
  data: string,
  settings?: Partial<QRAppearanceSettings>
): Promise<string> {
  const appearance = { ...defaultAppearance, ...settings };

  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: appearance.errorCorrectionLevel,
      width: appearance.width,
      margin: appearance.margin,
      color: {
        dark: appearance.darkColor,
        light: appearance.lightColor,
      },
    });
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

export async function generateQRCodeBuffer(
  data: string,
  settings?: Partial<QRAppearanceSettings>
): Promise<Buffer> {
  const appearance = { ...defaultAppearance, ...settings };

  try {
    return await QRCode.toBuffer(data, {
      errorCorrectionLevel: appearance.errorCorrectionLevel,
      width: appearance.width,
      margin: appearance.margin,
      color: {
        dark: appearance.darkColor,
        light: appearance.lightColor,
      },
    });
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

export function generateUniqueCode(
  userId: string,
  type: string,
  settings?: Partial<QRFormatSettings>
): string {
  const format = { ...defaultFormat, ...settings };

  let code = format.customFormat;

  // Replace variables
  code = code.replace('{PREFIX}', format.prefix);
  code = code.replace('{TYPE}', type.toUpperCase());

  if (format.includeUserId) {
    code = code.replace('{USER_ID}', userId.substring(0, 8));
  } else {
    code = code.replace('{USER_ID}', '');
  }

  if (format.includeTimestamp) {
    code = code.replace('{TIMESTAMP}', Date.now().toString());
  } else {
    code = code.replace('{TIMESTAMP}', '');
  }

  if (format.includeRandom) {
    const random = Math.random().toString(36).substring(2, 8);
    code = code.replace('{RANDOM}', random);
  } else {
    code = code.replace('{RANDOM}', '');
  }

  // Clean up any double dashes or trailing dashes
  code = code.replace(/--+/g, '-').replace(/^-|-$/g, '');

  return code;
}

export interface QRCodeFormatResolverData {
  manychatSubscriber?: ManychatSubscriber;
  tags?: Array<{ manychatTagId: string; name: string }>;
  customFields?: Array<{ manychatFieldId: string; name: string; value?: any }>;
}

/**
 * Generate a random alphanumeric string
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Resolve dynamic placeholders in QR code format pattern
 * Supports:
 * - {{first_name}}, {{last_name}}, {{email}}, etc. (system fields)
 * - {{tag:TAG_ID}} (tag references)
 * - {{custom_field:FIELD_ID}} (custom field references)
 * - {{random}} or {{random:N}} (random string of N characters, default 6)
 */
export function resolveQRCodeFormat(
  pattern: string,
  data: QRCodeFormatResolverData
): string {
  let resolved = pattern;

  // Replace system fields from Manychat subscriber
  if (data.manychatSubscriber) {
    const subscriber = data.manychatSubscriber;
    const systemFieldMap: Record<string, any> = {
      id: subscriber.id,
      first_name: subscriber.first_name || '',
      last_name: subscriber.last_name || '',
      full_name: subscriber.name || `${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim(),
      email: subscriber.email || '',
      phone: subscriber.phone || '',
      gender: subscriber.gender || '',
      locale: subscriber.locale || '',
      timezone: subscriber.timezone || '',
      profile_pic: subscriber.profile_pic || '',
      subscribed_at: subscriber.subscribed || '',
    };

    // Replace {{field_name}} with actual values
    Object.keys(systemFieldMap).forEach((field) => {
      const regex = new RegExp(`\\{\\{${field}\\}\\}`, 'g');
      resolved = resolved.replace(regex, String(systemFieldMap[field] || ''));
    });
  }

  // Replace tag references: {{tag:TAG_ID}}
  if (data.tags) {
    data.tags.forEach((tag) => {
      const regex = new RegExp(`\\{\\{tag:${tag.manychatTagId}\\}\\}`, 'g');
      resolved = resolved.replace(regex, tag.name || '');
    });
  }

  // Replace custom field references: {{custom_field:FIELD_ID}}
  if (data.customFields) {
    data.customFields.forEach((field) => {
      const regex = new RegExp(`\\{\\{custom_field:${field.manychatFieldId}\\}\\}`, 'g');
      resolved = resolved.replace(regex, String(field.value || ''));
    });
  }

  // Replace random string placeholders: {{random}} or {{random:6}}
  resolved = resolved.replace(/\{\{random(?::(\d+))?\}\}/g, (match, lengthStr) => {
    const length = lengthStr ? parseInt(lengthStr) : 6;
    return generateRandomString(length);
  });

  // Clean up any remaining unreplaced placeholders
  resolved = resolved.replace(/\{\{[^}]+\}\}/g, '');

  // Clean up double dashes, spaces, or leading/trailing dashes
  resolved = resolved.replace(/--+/g, '-').replace(/\s+/g, '-').replace(/^-|-$/g, '');

  return resolved;
}
