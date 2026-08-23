import { createFileRoute, redirect } from '@tanstack/react-router';

/*
 * `/home` is an alias for the index, and has been since before the migration:
 * `src/app/(page)/home/page.tsx` was five lines that called Next's `redirect()`.
 *
 * It throws rather than returns, which is how both routers express a redirect —
 * the throw is what stops the rest of the route from running. `beforeLoad` is
 * the right place: it runs before the loader, so the dictionary is never fetched
 * for a request that is only going to be redirected.
 */
export const Route = createFileRoute('/_page/home')({
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
});
