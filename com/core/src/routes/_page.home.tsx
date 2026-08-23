import { createFileRoute, redirect } from '@tanstack/react-router';

/*
 * `/home` is a long-standing alias for the index.
 *
 * It throws rather than returns, which is how the router expresses a redirect —
 * the throw is what stops the rest of the route from running. `beforeLoad` is
 * the right place: it runs before the loader, so the dictionary is never fetched
 * for a request that is only going to be redirected.
 */
export const Route = createFileRoute('/_page/home')({
  beforeLoad: () => {
    throw redirect({ to: '/' });
  },
});
