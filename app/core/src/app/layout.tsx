import type { Metadata } from 'next';
import { defaultLocale } from '@/i18n/config';
import { Inter } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegistration } from '../components/service-worker-registration';

/*
 * The CSS variable is `--font-inter`, not `--font-sans`: `--font-sans` is
 * Tailwind's own font token, declared in `globals.css`, and it names this
 * variable as the first family in the Japanese-aware stack. Pointing both at
 * the same name would make the token reference itself.
 */
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'UMAXICA (APP)',
    template: '%s — UMAXICA (APP)',
  },
  description: 'UMAXICA Service Application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={defaultLocale} className={inter.variable}>
      <body className="bg-gray-50 text-gray-900 leading-body">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
