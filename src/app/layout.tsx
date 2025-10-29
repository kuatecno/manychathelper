import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth-provider';
import { AdminSidebar } from '@/components/admin-sidebar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mchat-Tools',
  description: 'Admin panel for Mchat-Tools and automation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="flex h-screen">
              <AdminSidebar />
              <main className="flex-1 overflow-y-auto bg-background">
                <div className="container mx-auto p-6">{children}</div>
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
