import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UMAXICA News',
  description: 'Latest news from UMAXICA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <body>{children}</body>;
}
