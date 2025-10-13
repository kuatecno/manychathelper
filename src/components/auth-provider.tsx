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
    if (!admin) {
      router.push('/login');
    }
  }, [pathname, router]);

  return <>{children}</>;
}
