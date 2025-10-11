import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const SettingsSchema = z.object({
  key: z.string(),
  value: z.any(),
});

// GET /api/settings?key=qr_appearance
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (!key) {
      // Return all settings
      const settings = await prisma.settings.findMany();
      const settingsMap: Record<string, any> = {};

      settings.forEach((setting) => {
        try {
          settingsMap[setting.key] = JSON.parse(setting.value);
        } catch {
          settingsMap[setting.key] = setting.value;
        }
      });

      return NextResponse.json(settingsMap);
    }

    // Return specific setting
    const setting = await prisma.settings.findUnique({
      where: { key },
    });

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    return NextResponse.json({
      key: setting.key,
      value: JSON.parse(setting.value),
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = SettingsSchema.parse(body);

    const setting = await prisma.settings.upsert({
      where: { key: validated.key },
      update: {
        value: JSON.stringify(validated.value),
      },
      create: {
        key: validated.key,
        value: JSON.stringify(validated.value),
      },
    });

    return NextResponse.json({
      success: true,
      key: setting.key,
      value: JSON.parse(setting.value),
    });
  } catch (error) {
    console.error('Error updating settings:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
