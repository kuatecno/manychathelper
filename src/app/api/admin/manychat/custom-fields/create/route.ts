import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const createFieldSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['text', 'number', 'date', 'datetime', 'boolean']),
  description: z.string().optional(),
});

const bulkCreateFieldsSchema = z.object({
  fields: z.array(createFieldSchema).min(1).max(10),
});

/**
 * POST /api/admin/manychat/custom-fields/create
 * Create custom fields in Manychat (auto-adds flowkick_ prefix)
 */
export async function POST(request: NextRequest) {
  try {
    // Get adminId from header
    const adminId = request.headers.get('x-admin-id');

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      include: {
        manychatConfig: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    if (!admin.manychatConfig?.apiToken) {
      return NextResponse.json(
        { error: 'Manychat not configured' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validationResult = bulkCreateFieldsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { fields } = validationResult.data;

    // Create fields in Manychat
    const results = [];
    const errors = [];

    for (const field of fields) {
      try {
        // Ensure flowkick_ prefix
        const fieldName = field.name.startsWith('flowkick_')
          ? field.name
          : `flowkick_${field.name}`;

        // Create field via Manychat API
        const response = await fetch(
          'https://api.manychat.com/fb/page/createCustomField',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${admin.manychatConfig.apiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: fieldName,
              type: field.type,
              description: field.description || `Flowkick QR field: ${fieldName}`,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();

          // Store in local database
          await prisma.customField.create({
            data: {
              adminId: admin.id,
              manychatFieldId: data.data.id.toString(),
              name: fieldName,
              type: field.type,
              description: field.description || null,
            },
          }).catch(() => {
            // Field might already exist in our DB, that's ok
          });

          results.push({
            success: true,
            field: {
              id: data.data.id,
              name: fieldName,
              type: field.type,
            },
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          errors.push({
            field: fieldName,
            error: errorData.message || 'Failed to create field',
          });
        }
      } catch (error) {
        console.error('Error creating field:', error);
        errors.push({
          field: field.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Sync all custom fields to ensure we're up to date
    try {
      const fieldsResponse = await fetch(
        'https://api.manychat.com/fb/page/getCustomFields',
        {
          headers: {
            'Authorization': `Bearer ${admin.manychatConfig.apiToken}`,
          },
        }
      );

      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();

        // Update local database with any new fields
        for (const mcField of fieldsData.data) {
          await prisma.customField.upsert({
            where: {
              adminId_manychatFieldId: {
                adminId: admin.id,
                manychatFieldId: mcField.id.toString(),
              },
            },
            update: {
              name: mcField.name,
              type: mcField.type,
              description: mcField.description || null,
            },
            create: {
              adminId: admin.id,
              manychatFieldId: mcField.id.toString(),
              name: mcField.name,
              type: mcField.type,
              description: mcField.description || null,
            },
          }).catch(() => {
            // Ignore errors for individual fields
          });
        }
      }
    } catch (error) {
      console.error('Error syncing custom fields:', error);
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error creating custom fields:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/manychat/custom-fields/create
 * Get available custom fields from Manychat
 */
export async function GET(request: NextRequest) {
  try {
    // Get adminId from header
    const adminId = request.headers.get('x-admin-id');

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      include: {
        manychatConfig: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    if (!admin.manychatConfig?.apiToken) {
      return NextResponse.json(
        { error: 'Manychat not configured' },
        { status: 400 }
      );
    }

    // Fetch custom fields from Manychat
    const response = await fetch(
      'https://api.manychat.com/fb/page/getCustomFields',
      {
        headers: {
          'Authorization': `Bearer ${admin.manychatConfig.apiToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: 'Failed to fetch custom fields',
          message: errorData.message || response.statusText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      fields: data.data.map((field: any) => ({
        id: field.id,
        name: field.name,
        type: field.type,
        description: field.description,
      })),
    });
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
