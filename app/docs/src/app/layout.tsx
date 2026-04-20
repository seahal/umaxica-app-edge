import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UMAXICA Docs',
  description: 'Documentation for UMAXICA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <body>{children}</body>;
}
