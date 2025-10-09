import QRCode from 'qrcode';

export async function generateQRCodeDataURL(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
    });
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
  try {
    return await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2,
    });
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

export function generateUniqueCode(userId: string, type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type.toUpperCase()}-${userId.substring(0, 8)}-${timestamp}-${random}`;
}
