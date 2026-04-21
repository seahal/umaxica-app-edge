import type { Metadata } from 'next';
import { defaultLocale } from '@/i18n/config';

export const metadata: Metadata = {
  title: 'UMAXICA Help',
  description: 'Help center for UMAXICA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={defaultLocale}>
      <body>{children}</body>
    </html>
  );
}
