import QRCode from 'qrcode';

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
