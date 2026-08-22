import type { Metadata } from 'next';
import { defaultLocale } from '@/i18n/config';
import { Inter } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegistration } from '../components/service-worker-registration';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'UMAXICA (ORG)',
    template: '%s — UMAXICA (ORG)',
  },
  description: 'UMAXICA Staff Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={defaultLocale} className={inter.variable}>
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
