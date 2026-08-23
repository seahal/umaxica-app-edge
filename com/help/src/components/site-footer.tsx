import { Link } from '@tanstack/react-router';

const CANONICAL_HOME_URL = 'https://help-jp.umaxica.com/';

/**
 * The UMAXICA application shell footer, in two layers:
 *
 *   utility navigation  (About …)
 *   site identity       (© year UMAXICA)
 *
 * The utility navigation links only to surfaces that exist on this unit.
 * There is no privacy or terms route anywhere in this repository and no
 * reusable legal text to build one from, so neither is linked — a plausible
 * dead link is worse than a missing one.
 *
 * Both rows wrap rather than reflow: `flex-wrap` gives `copyright ⟷ URL` on a
 * wide viewport and copyright above URL on a narrow one, without a media
 * query.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white py-4">
      <nav
        className="mx-auto flex w-full max-w-7xl flex-wrap gap-x-6 px-4 wide:px-8"
        aria-label="ユーティリティナビゲーション"
      >
        <Link className="inline-flex min-h-11 items-center text-sm text-brand" to="/about">
          このサイトについて
        </Link>
      </nav>
      <p className="mx-auto flex w-full max-w-7xl flex-wrap justify-between gap-2 px-4 text-sm text-gray-600 wide:px-8">
        <span>© {new Date().getUTCFullYear()} UMAXICA</span>
        <a className="text-brand" href={CANONICAL_HOME_URL}>
          {CANONICAL_HOME_URL}
        </a>
      </p>
    </footer>
  );
}
