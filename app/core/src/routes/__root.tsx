import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { ErrorDocument, NotFoundDocument } from '@/components/status-documents';
import { defaultLocale } from '@/i18n/config';

import styleUrl from '../globals.css?url';

export const Route = createRootRoute({
  /*
   * There is deliberately NO title here.
   *
   * `<HeadContent />` renders the head tags of every matched route and React
   * hoists a `<title>` a component renders on top of that, so a root title plus
   * a failure document's own title produces TWO `<title>` elements —
   * `api/title-contract.hurl` asserts `count(//title) == 1`. Every route that
   * renders a document owns its title outright.
   */
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: 'UMAXICA Service Application' },
    ],
    links: [
      { rel: 'stylesheet', href: styleUrl },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  notFoundComponent: NotFoundDocument,
  errorComponent: ErrorDocument,
  shellComponent: RootDocument,
});

/*
 * The bare document, with no application chrome.
 *
 * This is the same split the Next.js version had: the root layout supplied
 * `<html>` and `<body>` only, and the header, navigation and footer lived on the
 * `(page)` route group's layout so that the status surfaces outside that group
 * stayed chrome-free. `src/routes/_page.tsx` is that group, and the not-found
 * and error documents sit outside it — so, unlike the satellite frames, this
 * frame's failure documents keep exactly the shape they had.
 */
function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang={defaultLocale}>
      <head>
        <HeadContent />
      </head>
      <body className="bg-gray-50 leading-body text-gray-900">
        <ServiceWorkerRegistration />
        {children}
        <Scripts />
      </body>
    </html>
  );
}
