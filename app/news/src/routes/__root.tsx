import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { ServiceWorkerRegistration } from '../components/service-worker-registration';
import { SiteFooter } from '../components/site-footer';
import { SiteHeader } from '../components/site-header';
import { SkipLink } from '../components/skip-link';
import { ErrorDocument, NotFoundDocument } from '../components/status-documents';
import { defaultLocale } from '../i18n/config';

import styleUrl from '../style.css?url';

export const Route = createRootRoute({
  head: () => ({
    /*
     * There is deliberately NO title here.
     *
     * Next's `metadata.title.template` let a root default and a page title
     * coexist because Next resolved them into one string. TanStack's
     * `<HeadContent />` renders the head tags of every matched route, and React
     * hoists a `<title>` a component renders on top of that — so a root title
     * plus a not-found document's own title produces TWO `<title>` elements, and
     * `api/title-contract.hurl` asserts `count(//title) == 1`. Measured, not
     * assumed: the 404 emitted both before this was moved.
     *
     * So every route that renders a document owns its title outright — the index
     * route carries what used to be the root default — and `brandTitle()` in
     * `src/lib/title.ts` is what keeps the suffix identical across them.
     */
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'description', content: 'News and announcements from UMAXICA.' },
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
 * The shell. `next/font` is gone, so `<html>` carries no font class — the stack
 * comes from `--font-sans` in `style.css` for every document on this unit.
 *
 * A flex column so `<main>`'s `flex-1` pushes the footer to the bottom of a
 * short page without anyone measuring a viewport.
 */
function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang={defaultLocale}>
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col bg-gray-50 leading-body text-gray-900">
        <ServiceWorkerRegistration />
        {/*
         * First in document order, and therefore the first thing a keyboard
         * reader reaches. `position: absolute`, so the flex column below is
         * unaffected and `<main>`'s `flex-1` still decides the layout.
         */}
        <SkipLink />
        {/*
         * The shell wraps `{children}` rather than supplying its own `<main>`:
         * every route under it — including the two failure documents below —
         * renders exactly one `<main>`, and a second would break the document
         * landmarks.
         *
         * Unlike the Next.js original, the failure documents render INSIDE this
         * shell rather than replacing it, so they now carry the header and
         * footer. `global-error.tsx` and `global-not-found.tsx` replaced the
         * layout and were chrome-free; TanStack renders `notFoundComponent` and
         * `errorComponent` within the root document, and reproducing the old
         * shape would mean branching the one component that must never itself
         * throw. Recorded as a deliberate regression in
         * plans/info-nextjs-to-tanstack-start.md §28.
         */}
        <SiteHeader />
        {children}
        <SiteFooter />
        <Scripts />
      </body>
    </html>
  );
}
