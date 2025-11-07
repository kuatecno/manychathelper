/**
 * Authentication Helper for API Routes
 * Simple header-based authentication until proper auth is implemented
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function getAdminFromRequest(request: NextRequest): Promise<{
  admin: any | null;
  error?: string;
}> {
  // Get adminId from header
  const adminId = request.headers.get('x-admin-id');

  if (!adminId) {
    return { admin: null, error: 'Missing x-admin-id header' };
  }

  // Fetch admin
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    include: {
      manychatConfig: true,
    },
  });

  if (!admin) {
    return { admin: null, error: 'Admin not found' };
  }

  return { admin };
}
