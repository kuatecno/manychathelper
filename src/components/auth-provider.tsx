'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const publicPaths = ['/login', '/register'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Skip auth check for public paths
    if (publicPaths.includes(pathname)) {
      return;
    }

    // Check if user is authenticated
    const admin = localStorage.getItem('admin');
    console.log('AuthProvider check - pathname:', pathname, 'admin:', admin);

    if (!admin) {
      console.log('No admin found, redirecting to login');
      router.push('/login');
    } else {
      console.log('Admin found:', JSON.parse(admin));
    }
  }, [pathname, router]);

  return <>{children}</>;
}
