import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UMAXICA Help',
  description: 'Help center for UMAXICA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <body>{children}</body>;
}
