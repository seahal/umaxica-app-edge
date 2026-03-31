import type { Metadata } from 'next';
import { defaultLocale } from '@/i18n/config';

export const metadata: Metadata = {
  title: 'UMAXICA News',
  description: 'Latest news from UMAXICA',
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
