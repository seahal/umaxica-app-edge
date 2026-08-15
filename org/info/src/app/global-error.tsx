'use client';

import './style.css';

/*
 * `global-error` replaces the root layout entirely, so it renders its own
 * `<html>` and `<body>` — and therefore has to import the stylesheet itself.
 * Without that import this document shipped unstyled, which is the one failure
 * surface a reader is guaranteed to meet at a bad moment.
 *
 * It carries no `next/font` class, which is why `--font-sans` in `style.css`
 * gives `var(--font-inter, …)` a fallback: the Japanese stack still applies
 * here, just without Inter in front of it.
 */

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <head>
        <title>現在、このページを表示できません — UMAXICA (ORG)</title>
      </head>
      <body className="flex min-h-screen flex-col bg-gray-50 text-gray-900 leading-body">
        <main className="grid flex-1 place-content-center gap-3 p-6 text-center">
          <h1 className="text-2xl font-semibold leading-heading">
            現在、このページを表示できません
          </h1>
          <p>HTTP 500</p>
          <button
            type="button"
            className="inline-flex min-h-11 cursor-pointer items-center justify-self-center rounded-full border border-gray-300 bg-white px-4 py-2 hover:bg-gray-100"
            onClick={() => reset()}
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
