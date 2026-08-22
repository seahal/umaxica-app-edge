'use client';

import { useCallback } from 'react';

import './globals.css';

/*
 * `global-error` replaces the root layout entirely, so it renders its own
 * `<html>` and `<body>` — and therefore has to import the stylesheet itself.
 * Without that import this document shipped unstyled, which is the one failure
 * surface a reader is guaranteed to meet at a bad moment.
 *
 * It carries no `next/font` class, which is why `--font-sans` in `globals.css`
 * gives `var(--font-inter, …)` a fallback: the Japanese stack still applies
 * here, just without Inter in front of it.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleReset = useCallback(() => reset(), [reset]);
  return (
    <html lang="ja">
      <head>
        <title>現在、このページを表示できません — UMAXICA (COM)</title>
      </head>
      <body className="bg-gray-50 leading-body text-gray-900">
        <main className="grid min-h-screen place-content-center gap-3 p-6 text-center">
          <h1 className="text-2xl leading-heading font-semibold">
            現在、このページを表示できません
          </h1>
          <p>HTTP 500</p>
          <button
            onClick={handleReset}
            type="button"
            className="inline-flex min-h-11 cursor-pointer items-center justify-self-center rounded-full border border-gray-300 bg-white px-4 py-2 hover:bg-gray-100"
          >
            再読み込み
          </button>
          <p>
            <a className="text-brand" href="/">
              トップへ戻る
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
