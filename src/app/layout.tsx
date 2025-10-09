import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manychat Helper API',
  description: 'Booking and QR code service for Manychat',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
