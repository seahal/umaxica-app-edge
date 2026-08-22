import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './style.css';
import { ServiceWorkerRegistration } from '../components/service-worker-registration';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });

export const metadata: Metadata = {
  title: {
    default: 'Info — UMAXICA (APP)',
    template: '%s — UMAXICA (APP)',
  },
  description: 'Information about the UMAXICA platform.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
