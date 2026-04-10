import type { Metadata } from 'next';
import './globals.css';
import { ServiceWorkerRegistration } from '../components/service-worker-registration';

export const metadata: Metadata = {
  title: 'UMAXICA (org)',
  description: 'UMAXICA Staff Application',
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
