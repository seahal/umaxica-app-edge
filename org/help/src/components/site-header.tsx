import Link from 'next/link';

/**
 * The UMAXICA application shell header, as this unit renders it.
 *
 *   brand (link to this edition's homepage) · actions slot
 *
 * The contract shared across every deployment unit is the semantics, the
 * hierarchy and the behaviour — not the component. This unit owns its own
 * copy, because a unit that imports a sibling cannot be extracted into its own
 * repository (`test/deployment-unit-boundaries.test.ts`), and one shared UI
 * package would couple independently deployed Workers to a single release.
 *
 * Brand is an `<a>`, never an `<h1>`: the `<h1>` belongs to the page, inside
 * `<main>`.
 *
 * The row is a wrapping flex row, so it holds from phone to desktop without a
 * media query — which is why this archetype needs no breakpoint at all.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex min-h-14 w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 wide:px-8">
        <Link
          className="inline-flex min-h-11 items-center text-xl font-bold tracking-wide"
          href="/"
        >
          UMAXICA
        </Link>
        {/*
         * Actions slot. Empty today by design — Search, Preferences, Account
         * and a Menu disclosure belong here once those surfaces exist. A
         * button that toggles nothing is worse than no button, and this unit
         * has no main navigation to toggle: it serves one content surface.
         */}
        <div className="flex min-h-11 items-center gap-2" />
      </div>
    </header>
  );
}
