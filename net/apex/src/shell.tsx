/** @jsxImportSource hono/jsx */
import type { Child } from 'hono/jsx';

const CANONICAL_HOME_URL = 'https://umaxica.net/';

/**
 * The UMAXICA application shell, as this unit renders it.
 *
 *   header (brand + actions) · [main navigation] · main · footer (utility nav + identity)
 *
 * The contract is the semantics, the hierarchy and the behaviour — not the
 * component. Every deployment unit owns its own copy, because a unit that
 * imports a sibling cannot be extracted into its own repository
 * (`test/deployment-unit-boundaries.test.ts`), and a shared UI package would
 * couple four independently deployed Workers to one release.
 *
 * This unit renders no main navigation: it serves a single page, and inventing
 * destinations that do not exist would produce dead links.
 */

type ShellLabels = {
  utilityNav: string;
  about: string;
};

const LABELS: Record<'en' | 'ja', ShellLabels> = {
  en: { utilityNav: 'Utility navigation', about: 'About' },
  ja: { utilityNav: 'ユーティリティナビゲーション', about: 'このサイトについて' },
};

function labelsFor(language: string | undefined): ShellLabels {
  return language === 'ja' ? LABELS.ja : LABELS.en;
}

/**
 * Brand is a link to this edition's homepage and deliberately not an `<h1>`:
 * the `<h1>` belongs to the page, inside `<main>`.
 */
export function SiteHeader({ brandName }: { brandName: string }) {
  return (
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto flex min-h-14 w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4">
        <a class="inline-flex min-h-11 items-center text-xl font-bold tracking-wide" href="/">
          {brandName}
        </a>
        {/*
         * Actions slot. Empty today by design — Search, Preferences, Account
         * and a Menu disclosure belong here when those surfaces exist, and a
         * control that toggles nothing is worse than no control at all.
         */}
        <div class="flex min-h-11 items-center gap-2" />
      </div>
    </header>
  );
}

export function SiteFooter({
  brandName,
  year,
  language,
}: {
  brandName: string;
  year: number;
  language: string | undefined;
}) {
  const labels = labelsFor(language);

  return (
    <footer class="mt-auto border-t border-gray-200 bg-white py-4">
      <nav
        class="mx-auto flex w-full max-w-7xl flex-wrap gap-x-6 px-4"
        aria-label={labels.utilityNav}
      >
        <a class="inline-flex min-h-11 items-center text-sm text-brand" href="/about">
          {labels.about}
        </a>
      </nav>
      <p class="mx-auto flex w-full max-w-7xl flex-wrap justify-between gap-2 px-4 text-sm text-gray-600">
        <span>
          &copy; {year} {brandName}
        </span>
        <a class="text-brand" href={CANONICAL_HOME_URL}>
          {CANONICAL_HOME_URL}
        </a>
      </p>
    </footer>
  );
}

export function AppShell({
  brandName,
  year,
  language,
  children,
}: {
  brandName: string;
  year: number;
  language: string | undefined;
  children?: Child;
}) {
  return (
    <>
      <SiteHeader brandName={brandName} />
      <main class="mx-auto w-full max-w-7xl grow px-4 py-8">{children}</main>
      <SiteFooter brandName={brandName} year={year} language={language} />
    </>
  );
}
