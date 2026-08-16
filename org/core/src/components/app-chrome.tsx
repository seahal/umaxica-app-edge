'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from 'react-aria-components';

/**
 * Header and main navigation for the UMAXICA application shell.
 *
 * The two are separate concepts and separate elements: the header carries the
 * brand and the global actions, the navigation carries movement inside the
 * application. `<nav>` is a sibling of `<header>`, never nested in it, so this
 * unit can later become a desktop sidebar, a tablet rail or a mobile bottom
 * bar without the header participating in that decision.
 *
 * This is the one client component the shell needs: the menu is a disclosure,
 * and a disclosure has state. Everything else in the shell stays a Server
 * Component. Labels arrive as plain strings — the dictionary is never loaded
 * on the client.
 *
 * The trigger is `react-aria-components`' `<Button>`, which renders a real
 * `<button type="button">` and normalises press across mouse, touch, pen and
 * keyboard — this is the control a phone user taps, so that normalisation is
 * the point. It also publishes `data-hovered` / `data-pressed` /
 * `data-focus-visible`, which the `tailwindcss-react-aria-components` plugin
 * turns into the `hovered:` and `pressed:` variants used below.
 *
 * `aria-expanded` and `aria-controls` stay explicit here rather than coming
 * from `<Disclosure>` / `<DisclosurePanel>`, and that is deliberate. React
 * Aria's disclosure owns its panel's visibility: it renders the panel with
 * `hidden` and `aria-hidden` while collapsed. The navigation below must be
 * visible above the breakpoint *with no JavaScript at all* — see
 * `docs/design/ui-shell-contract.md` §5 — and `aria-hidden` cannot be undone
 * from CSS, so a disclosure-owned panel would ship every desktop reader a
 * navigation that is invisible and absent from the accessibility tree until
 * hydration finishes. Visibility therefore stays a media query, and this
 * component owns only the state the media query reads.
 */

export type NavigationLink = {
  href: Route;
  label: string;
};

export type ChromeLabels = {
  brand: string;
  menu: string;
  primaryNav: string;
};

export function AppChrome({
  links,
  labels,
}: Readonly<{ links: readonly NavigationLink[]; labels: ChromeLabels }>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="col-span-full border-b border-gray-200 bg-white">
        <div className="mx-auto flex min-h-14 w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 wide:px-8">
          {/*
           * Brand is a link to this edition's homepage, not an `<h1>`: the
           * `<h1>` belongs to the page, inside `<main>`.
           */}
          <Link
            className="inline-flex min-h-11 items-center text-xl font-bold tracking-wide"
            href="/"
          >
            {labels.brand}
          </Link>
          <div className="flex min-h-11 items-center gap-2">
            {/*
             * A disclosure, so a button — it toggles content in place and
             * navigates nowhere. Search and Account belong beside it once
             * those surfaces exist. `wide:hidden` is the other half of §5:
             * above the breakpoint there is nothing to toggle, and a control
             * that toggles nothing is worse than no control.
             */}
            <Button
              className="hovered:bg-gray-100 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-gray-300 bg-white px-4 py-2 wide:hidden pressed:bg-gray-200"
              aria-expanded={open}
              aria-controls="main-navigation"
              onPress={() => setOpen((previous) => !previous)}
            >
              {labels.menu}
            </Button>
          </div>
        </div>
      </header>
      {/*
       * `data-open` only decides visibility below the breakpoint, where the
       * toggle is the only way to reach the navigation. Above it `wide:grid`
       * shows it unconditionally, so no state — and no absent JavaScript — can
       * strand a desktop user.
       */}
      <nav
        id="main-navigation"
        className="hidden content-start gap-2 border-b border-gray-200 bg-white px-5 py-4 data-[open=true]:grid wide:col-start-1 wide:grid wide:border-r wide:border-b-0 wide:p-8"
        aria-label={labels.primaryNav}
        data-open={open}
      >
        {links.map((link) => (
          <Link className="rounded-lg px-3 py-2 hover:bg-gray-100" href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
