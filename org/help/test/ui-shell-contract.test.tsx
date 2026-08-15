import { within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectTitleContract, TLD } from './utils/title-contract';

vi.mock('next/font/google', () => ({ Inter: () => ({ variable: 'font-sans' }) }));

import Layout from '../src/app/layout';
import Page from '../src/app/page';
import About, { metadata as aboutMetadata } from '../src/app/about/page';

/**
 * The UMAXICA application shell, asserted on the emitted document.
 *
 * What has to stay identical across every deployment unit is the contract —
 * semantics, hierarchy, accessible names, which destinations are reachable —
 * and not the components, which each unit owns separately so it stays
 * independently deployable.
 *
 * These assertions deliberately do not name a CSS class. Every visual rule is
 * a Tailwind utility now, so a class list is styling rather than structure, and
 * a test that pinned one would fail on a padding change while still passing if
 * the `<nav>` lost its accessible name. Roles, landmarks, accessible names and
 * document order are the contract; utilities are an implementation detail.
 */
const shell = (Page_: () => React.JSX.Element) =>
  renderToStaticMarkup(
    <Layout>
      <Page_ />
    </Layout>,
  );

const shellDom = (Page_: () => React.JSX.Element) => {
  document.body.innerHTML = shell(Page_);
  return within(document.body);
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('application shell', () => {
  it('emits exactly one header, main and footer, in document order', () => {
    const html = shell(Page);

    for (const tag of ['header', 'main', 'footer']) {
      expect(html.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? [], `<${tag}>`).toHaveLength(1);
    }

    expect(html.indexOf('<header')).toBeLessThan(html.indexOf('<main'));
    expect(html.indexOf('<main')).toBeLessThan(html.indexOf('<footer'));
  });

  it('exposes the document landmarks', () => {
    const dom = shellDom(Page);

    expect(dom.getByRole('banner')).toBeInTheDocument();
    expect(dom.getByRole('main')).toBeInTheDocument();
    expect(dom.getByRole('contentinfo')).toBeInTheDocument();
    // One navigation only — the footer's. It still carries an accessible name,
    // so it reads the same way here as it does on a unit that has two.
    expect(dom.getAllByRole('navigation')).toHaveLength(1);
    expect(
      dom.getByRole('navigation', { name: 'ユーティリティナビゲーション' }),
    ).toBeInTheDocument();
  });

  it('links the brand to this edition’s homepage without stealing the page heading', () => {
    const html = shell(Page);
    const dom = shellDom(Page);
    const header = html.slice(html.indexOf('<header'), html.indexOf('</header>'));

    expect(within(dom.getByRole('banner')).getByRole('link', { name: 'UMAXICA' })).toHaveAttribute(
      'href',
      '/',
    );
    // The `<h1>` belongs to the page, inside `<main>` — not to the header.
    expect(header).not.toContain('<h1');
    expect(within(dom.getByRole('main')).getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('ships no dead control in the header', () => {
    const banner = within(shellDom(Page).getByRole('banner'));

    /*
     * The actions slot itself is not asserted: it is an empty `<div>` and an
     * empty `<div>` has no semantics to assert once its class list stopped
     * being structure. What the contract actually forbids is a control that
     * does nothing — this unit has no main navigation to toggle, so the header
     * holds the brand link and nothing else interactive.
     */
    expect(banner.getAllByRole('link')).toHaveLength(1);
    expect(banner.queryByRole('button')).toBeNull();
  });

  it('renders no main navigation, because this unit has no second destination', () => {
    const html = shell(Page);

    expect(html.slice(0, html.indexOf('<footer'))).not.toContain('<nav');
  });

  it('gives the footer two layers: a named utility nav and the site identity', () => {
    const html = shell(Page);
    const dom = shellDom(Page);
    const footer = html.slice(html.indexOf('<footer'), html.indexOf('</footer>'));

    const contentinfo = dom.getByRole('contentinfo');
    const utility = within(contentinfo).getByRole('navigation', {
      name: 'ユーティリティナビゲーション',
    });

    expect(within(utility).getByRole('link', { name: 'このサイトについて' })).toHaveAttribute(
      'href',
      '/about',
    );

    // Utility navigation first, site identity second.
    expect(footer.indexOf('</nav>')).toBeLessThan(footer.indexOf('©'));
    expect(footer).toMatch(/©\s*\d{4} UMAXICA/);
    expect(
      within(contentinfo).getByRole('link', { name: 'https://help-jp.umaxica.org/' }),
    ).toHaveAttribute('href', 'https://help-jp.umaxica.org/');
  });

  it('links only to destinations that exist', () => {
    const hrefs = [...shell(Page).matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]);

    // Neither a privacy nor a terms route exists in this repository, and there
    // is no reusable legal text to build one from, so neither may be linked.
    expect(hrefs).not.toContain('/privacy');
    expect(hrefs).not.toContain('/terms');
    // This unit has no preference surface either.
    expect(hrefs).not.toContain('/preferences');

    expect(new Set(hrefs)).toEqual(new Set(['/', '/about']));
  });
});

describe('/about', () => {
  it('renders inside the shell with its own page heading', () => {
    const html = shell(About);

    expect(html).toContain('<h1');
    expect(html).toContain('このサイトについて');
    expect(html.match(/<main[\s>]/g) ?? []).toHaveLength(1);
  });

  it('names the page in the title without naming the surface or the runtime', () => {
    const pageTitle = aboutMetadata.title;

    // A plain string, so the root layout's template is what closes it.
    expect(pageTitle, 'page title must be a bare string').toBeTypeOf('string');
    expect(pageTitle).toBe('このサイトについて');

    expectTitleContract(`<title>${pageTitle as string} — UMAXICA (${TLD})</title>`, {
      requirePageSpecific: true,
      label: '/about',
    });
  });
});
