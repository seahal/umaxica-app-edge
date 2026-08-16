'use client';

import * as Sentry from '@sentry/nextjs';
import { useCallback, useEffect } from 'react';

import './globals.css';

/*
 * `global-error` replaces the root layout entirely, so it renders its own
 * `<html>` and `<body>` and has to import the stylesheet itself. Without that
 * import this document shipped unstyled — and it carried a `status-page` class
 * that no rule in this unit ever defined.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const handleReset = useCallback(() => reset(), [reset]);
  return (
    <html lang="ja">
      <head>
        <title>現在、このページを表示できません — UMAXICA (DEV)</title>
      </head>
      <body className="bg-linear-to-b from-canvas-top to-canvas font-serif leading-body text-ink">
        <main className="grid min-h-screen place-content-center gap-3 p-6 text-center">
          <h1 className="text-5xl leading-heading">500</h1>
          <p className="text-muted">Something went wrong.</p>
          <button
            onClick={handleReset}
            type="button"
            className="inline-flex min-h-11 cursor-pointer items-center justify-self-center rounded-full border border-muted px-4 py-2 hover:bg-canvas-top"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
