import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RegisterUserSchema } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RegisterUserSchema.parse(body);

    // Check if user already exists with this manychat ID
    const existingUser = await prisma.user.findUnique({
      where: { manychatId: validated.manychat_user_id },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'User already registered',
          username: existingUser.username,
          user_id: existingUser.id,
        },
        { status: 409 }
      );
    }

    // Check if username is already taken
    const usernameExists = await prisma.user.findUnique({
      where: { username: validated.username },
    });

    if (usernameExists) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        manychatId: validated.manychat_user_id,
        username: validated.username,
        firstName: validated.first_name,
        lastName: validated.last_name,
        timezone: validated.timezone,
      },
    });

    return NextResponse.json({
      success: true,
      user_id: user.id,
      username: user.username,
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Error registering user:', error);

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if username is available
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    return NextResponse.json({
      available: !user,
      username,
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { error: 'Failed to check username' },
      { status: 500 }
    );
  }
}
