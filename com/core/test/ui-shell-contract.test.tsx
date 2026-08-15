import { fireEvent, render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('next/navigation', () => ({ redirect: vi.fn(), notFound: vi.fn() }));

import PageLayout from '../src/app/(page)/layout';
import { AppChrome } from '../src/components/app-chrome';
import { PageMain } from '../src/components/page-main';
import { defaultLocale } from '../src/i18n/config';
import { getDictionary } from '../src/i18n/dictionaries';

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

const shell = async () =>
  renderToStaticMarkup(await PageLayout({ children: <PageMain>content</PageMain> }));

/**
 * The UMAXICA application shell, asserted on the emitted document.
 *
 * What has to stay identical across every deployment unit is the contract —
 * semantics, hierarchy, accessible names, which destinations are reachable —
 * and not the components, which each unit owns separately so that it stays
 * independently deployable.
 *
 * These assertions deliberately do not name a CSS class. Every visual rule is
 * a Tailwind utility now, so a class list is styling rather than structure, and
 * a test that pinned one would fail on a padding change while still passing if
 * the `<nav>` lost its accessible name. Roles, landmarks, accessible names and
 * document order are the contract; utilities are an implementation detail.
 */
const shellDom = async () => {
  document.body.innerHTML = await shell();
  return within(document.body);
};

describe('application shell', () => {
  it('emits exactly one header, main and footer, in document order', async () => {
    const html = await shell();

    for (const tag of ['header', 'main', 'footer']) {
      expect(html.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? [], `<${tag}>`).toHaveLength(1);
    }

    expect(html.indexOf('<header')).toBeLessThan(html.indexOf('<main'));
    expect(html.indexOf('<main')).toBeLessThan(html.indexOf('<footer'));
  });

  it('exposes the four document landmarks', async () => {
    const dom = await shellDom();
    const dict = await getDictionary(defaultLocale);

    expect(dom.getByRole('banner')).toBeInTheDocument();
    expect(dom.getByRole('main')).toBeInTheDocument();
    expect(dom.getByRole('contentinfo')).toBeInTheDocument();
    // Two navigations, so each needs its own accessible name to be told apart.
    expect(dom.getAllByRole('navigation')).toHaveLength(2);
    expect(dom.getByRole('navigation', { name: dict.nav.primary })).toBeInTheDocument();
    expect(dom.getByRole('navigation', { name: dict.nav.utility })).toBeInTheDocument();
  });

  it('links the brand to this edition’s homepage without stealing the page heading', async () => {
    const html = await shell();
    const dom = await shellDom();
    const header = html.slice(html.indexOf('<header'), html.indexOf('</header>'));

    expect(within(dom.getByRole('banner')).getByRole('link', { name: 'UMAXICA' })).toHaveAttribute(
      'href',
      '/',
    );
    // The `<h1>` belongs to the page, inside `<main>` — not to the header.
    expect(header).not.toContain('<h1');
  });

  it('separates the header from the main navigation', async () => {
    const html = await shell();
    const header = html.slice(html.indexOf('<header'), html.indexOf('</header>'));
    const dict = await getDictionary(defaultLocale);

    // The navigation is a sibling of the header, never nested inside it, so
    // this unit can become a sidebar, a rail or a bottom bar independently.
    expect(header).not.toContain('<nav');
    expect(html).toContain(`<nav id="main-navigation"`);
    expect(html).toContain(`aria-label="${dict.nav.primary}"`);
    expect(html.indexOf('id="main-navigation"')).toBeLessThan(html.indexOf('<main'));
  });

  it('uses button semantics for the menu disclosure, wired to the navigation', async () => {
    const dom = await shellDom();
    const dict = await getDictionary(defaultLocale);

    const button = within(dom.getByRole('banner')).getByRole('button', { name: dict.nav.menu });

    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('aria-controls', 'main-navigation');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders the navigation in the server HTML rather than behind hydration', async () => {
    const dom = await shellDom();
    const dict = await getDictionary(defaultLocale);
    const nav = dom.getByRole('navigation', { name: dict.nav.primary });

    /*
     * Above the breakpoint the navigation is shown by a media query, with no
     * JavaScript involved (docs/design/ui-shell-contract.md §5). It must
     * therefore be present, un-hidden and in the accessibility tree in the
     * server-rendered HTML — which is exactly what a `react-aria-components`
     * `<DisclosurePanel>` would not give us, because it marks the collapsed
     * panel `hidden` and `aria-hidden`.
     */
    expect(nav).not.toHaveAttribute('hidden');
    expect(nav).not.toHaveAttribute('aria-hidden');
    expect(within(nav).getAllByRole('link').length).toBeGreaterThan(0);
  });

  it('gives the footer two layers: a named utility nav and the site identity', async () => {
    const html = await shell();
    const dom = await shellDom();
    const footer = html.slice(html.indexOf('<footer'), html.indexOf('</footer>'));
    const dict = await getDictionary(defaultLocale);

    const contentinfo = dom.getByRole('contentinfo');
    const utility = within(contentinfo).getByRole('navigation', { name: dict.nav.utility });

    expect(within(utility).getByRole('link', { name: dict.about.title })).toHaveAttribute(
      'href',
      '/about',
    );
    expect(footer).not.toContain('href="/configuration/preference"');

    // Utility navigation first, site identity second.
    expect(footer.indexOf('</nav>')).toBeLessThan(footer.indexOf('©'));
    expect(footer).toMatch(/©\s*\d{4} UMAXICA/);
    expect(
      within(contentinfo).getByRole('link', { name: 'https://jp.umaxica.com/' }),
    ).toHaveAttribute('href', 'https://jp.umaxica.com/');
  });

  it('links only to destinations this unit serves', async () => {
    const hrefs = [...(await shell()).matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]);

    // Neither a privacy nor a terms route exists in this repository, and there
    // is no reusable legal text to build one from, so neither may be linked.
    expect(hrefs).not.toContain('/privacy');
    expect(hrefs).not.toContain('/terms');
    expect(hrefs).not.toContain('/preferences');
    expect(hrefs).not.toContain('/configuration/preference');
    // Removed by ADR 009; the navigation pointed at it until this shell landed.
    expect(hrefs).not.toContain('/rails-health');

    expect(new Set(hrefs)).toEqual(
      new Set(['/', '/explore', '/messages', '/notifications', '/configuration', '/about']),
    );
  });

  it('localises every shell string through the existing dictionary', async () => {
    const html = await shell();
    const dict = await getDictionary(defaultLocale);

    for (const label of [dict.about.title, dict.explore.title, dict.nav.menu]) {
      expect(html, `missing localized label: ${label}`).toContain(label);
    }
  });
});

describe('menu disclosure', () => {
  const labels = { brand: 'UMAXICA', menu: 'メニュー', primaryNav: 'メインナビゲーション' };

  const mount = () => {
    render(<AppChrome links={[{ href: '/', label: 'ホーム' }]} labels={labels} />);
    return {
      button: screen.getByRole('button', { name: labels.menu }),
      nav: screen.getByRole('navigation', { name: labels.primaryNav }),
    };
  };

  it('toggles aria-expanded and the navigation’s open state', () => {
    const { button, nav } = mount();

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(nav).toHaveAttribute('data-open', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(nav).toHaveAttribute('data-open', 'true');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(nav).toHaveAttribute('data-open', 'false');
  });

  /*
   * The trigger is a `react-aria-components` `<Button>`, which handles press
   * through `onPress` rather than `onClick`. These two cases are the reason
   * that matters: a native `<button>` gets Enter and Space from the browser,
   * and this asserts the library did not take that away.
   */
  it.each([
    ['Enter', 'Enter'],
    ['Space', ' '],
  ])('activates on %s', (_name, key) => {
    const { button, nav } = mount();
    button.focus();

    fireEvent.keyDown(button, { key });
    fireEvent.keyUp(button, { key });

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(nav).toHaveAttribute('data-open', 'true');
  });

  it('keeps the trigger focusable and reachable by keyboard', () => {
    const { button } = mount();

    expect(button).not.toHaveAttribute('disabled');
    expect(button).not.toHaveAttribute('aria-disabled');
    button.focus();
    expect(button).toHaveFocus();
  });

  it('exposes the navigation by its accessible name', () => {
    render(<AppChrome links={[{ href: '/about', label: '概要' }]} labels={labels} />);

    expect(screen.getByRole('link', { name: '概要' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: labels.brand })).toHaveAttribute('href', '/');
  });
});
