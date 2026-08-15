import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { AppChrome } from '@/components/app-chrome';
import { SiteFooter } from '@/components/site-footer';

const BRAND_NAME = 'UMAXICA';

/**
 * The UMAXICA application shell for this unit's user-facing pages.
 *
 *   header (brand + actions) · main navigation · main · footer
 *
 * It lives on the `(page)` route group rather than on the root layout so the
 * status surfaces outside the group — `error.tsx`, `/offline`,
 * `global-not-found.tsx` — stay chrome-free, which is what a failure document
 * should be.
 *
 * `{children}` is rendered directly: every page under this layout already
 * supplies its own `<main>` through `<PageMain>`, and a second `<main>` would
 * break the document landmarks.
 *
 * The shell is a grid rather than nested flex boxes because header, navigation,
 * main and footer are four siblings — the contract keeps `<nav>` out of
 * `<header>`, so there is no wrapper to flex. Above the breakpoint the grid
 * gains a second column and the navigation and main content sit side by side;
 * below it there is one column and the four elements stack in source order.
 */
export default async function PageLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dict = await getDictionary(defaultLocale);

  // Main navigation: movement inside the application. Every entry is a route
  // this unit actually serves — `/rails-health` used to sit here and had been
  // dead since ADR 009 removed the route.
  const links = [
    { href: '/', label: dict.home.title },
    { href: '/explore', label: dict.explore.title },
    { href: '/messages', label: dict.messages.title },
    { href: '/notifications', label: dict.notifications.title },
    { href: '/configuration', label: dict.configuration.title },
    { href: '/about', label: dict.about.title },
  ] as const;

  return (
    <div className="grid min-h-screen grid-rows-[auto_1fr_auto] wide:grid-cols-[15rem_minmax(0,1fr)]">
      <AppChrome
        links={links}
        labels={{
          brand: BRAND_NAME,
          menu: dict.nav.menu,
          primaryNav: dict.nav.primary,
        }}
      />
      {children}
      <SiteFooter
        labels={{
          brand: BRAND_NAME,
          utilityNav: dict.nav.utility,
          about: dict.about.title,
        }}
      />
    </div>
  );
}
