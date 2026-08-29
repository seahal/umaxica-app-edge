import { createRouter } from '@tanstack/react-router';

import { ErrorDocument, NotFoundDocument } from '@/components/status-documents';

import { routeTree } from './routeTree.gen';
import { getRequestNonce } from './security-nonce';

/*
 * `notFoundMode: 'root'` rather than the default `'fuzzy'`: this unit has one
 * not-found document and it is the root's, so an unmatched path must never be
 * absorbed by whichever ancestor route happens to sit closest to it.
 *
 * `defaultNotFoundComponent` and `defaultErrorComponent` are NOT redundant with
 * the same two components on the root route. The root's pair covers a failure in
 * the root itself; these cover every descendant route that declares none.
 * Measured 2026-08-22 — with only the root's set, a throwing child route answered
 * 500 with no `<title>` and no `<main>` at all.
 *
 * `ssr.nonce` is what puts the CSP nonce on the one inline script TanStack emits
 * — `Scripts`, `ScriptOnce` and `Asset` all read it from here. It is read from
 * `AsyncLocalStorage` rather than taken as a parameter because
 * `createStartHandler` calls this function with no arguments, once per request.
 * Outside a request — the build, and every development response — there is no
 * store and the key is omitted entirely, which is the same object this function
 * returned before nonces existed.
 */
export function getRouter() {
  const nonce = getRequestNonce();

  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    notFoundMode: 'root',
    defaultNotFoundComponent: NotFoundDocument,
    defaultErrorComponent: ErrorDocument,
    scrollRestoration: true,
    ...(nonce === undefined ? {} : { ssr: { nonce } }),
  });
}
