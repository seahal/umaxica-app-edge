import type { Metadata } from 'next';
import './globals.css';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'UMAXICA (app)',
  description: 'UMAXICA Service Application',
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
