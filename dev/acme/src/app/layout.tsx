import type { Metadata } from 'next';

import { ServiceWorkerRegistration } from '../components/service-worker-registration';

import './globals.css';
import { defaultLocale } from '../i18n/config';

export const metadata: Metadata = {
  title: {
    default: 'UMAXICA (DEV)',
    template: '%s — UMAXICA (DEV)',
  },
  description: 'Developer domain for UMAXICA.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={defaultLocale}>
      {/*
       * `font-serif` rather than a Preflight default: this unit's face is the
       * identity, and Tailwind's `--default-font-family` follows `--font-sans`,
       * which this unit does not define.
       */}
      <body className="bg-linear-to-b from-canvas-top to-canvas font-serif leading-body text-ink">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
