import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Umaxica Dev',
  description: 'Fresh Next.js app for umaxica.dev',
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
