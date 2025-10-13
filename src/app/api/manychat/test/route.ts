import { NextRequest, NextResponse } from 'next/server';
import { createManychatClient } from '@/lib/manychat-client';
import { z } from 'zod';

const TestSchema = z.object({
  admin_id: z.string(),
  api_token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = TestSchema.parse(body);

    // Create client with provided token
    const client = createManychatClient(validated.api_token);

    // Test connection by getting page info
    const response = await client.getPageInfo();

    return NextResponse.json({
      success: true,
      page: response.data,
      message: 'Connection successful',
    });
  } catch (error) {
    console.error('Test connection error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Connection test failed',
        details: 'Please check your API token and try again',
      },
      { status: 500 }
    );
  }
}
