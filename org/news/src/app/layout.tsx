import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';

import { ServiceWorkerRegistration } from '../components/service-worker-registration';

import './style.css';
import { SiteFooter } from '../components/site-footer';
import { SiteHeader } from '../components/site-header';
import { defaultLocale } from '../i18n/config';

/*
 * The CSS variable is `--font-inter`, not `--font-sans`: `--font-sans` is
 * Tailwind's own font token, declared in `style.css`, and it names this
 * variable as the first family in the Japanese-aware stack. Pointing both at
 * the same name would make the token reference itself.
 */
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'News — UMAXICA (ORG)',
    template: '%s — UMAXICA (ORG)',
  },
  description: 'News and announcements from UMAXICA.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang={defaultLocale} className={inter.variable}>
      {/*
       * A flex column so `<main>`'s `flex-1` pushes the footer to the bottom of
       * a short page without anyone measuring a viewport.
       */}
      <body className="flex min-h-screen flex-col bg-gray-50 leading-body text-gray-900">
        <ServiceWorkerRegistration />
        {/*
         * The shell wraps `{children}` rather than supplying its own `<main>`:
         * every page under this layout — including `error.tsx` and `/offline` —
         * already renders exactly one `<main>`, and a second would break the
         * document landmarks. `global-error.tsx` and `global-not-found.tsx`
         * replace this layout entirely and therefore stay chrome-free, which is
         * correct for a failure document.
         */}
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
