import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const RegisterSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, hyphens, and underscores',
  }),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RegisterSchema.parse(body);

    // Check if username already exists
    const existingUsername = await prisma.admin.findUnique({
      where: { username: validated.username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.admin.findUnique({
      where: { email: validated.email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        username: validated.username,
        email: validated.email,
        password: hashedPassword,
        name: validated.name,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      admin,
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid registration data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
