import type { Metadata } from 'next';
import './globals.css';
import { ServiceWorkerRegistration } from '../components/service-worker-registration';

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
    <html lang="en">
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
