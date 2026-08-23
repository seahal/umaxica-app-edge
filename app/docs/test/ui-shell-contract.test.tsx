import { within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ErrorDocument } from '../src/components/status-documents';
import { aboutRoute, components, headTitleOf, renderDocument } from './utils/routes';
import { expectTitleContract } from './utils/title-contract';

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
/*
 * The documents are rendered once, through a real router, and then asserted
 * synchronously.
 *
 * Under Next the shell was a component this file could call directly. TanStack's
 * `<HeadContent />` reads router state, so the document only exists once a
 * router has loaded a path — which is asynchronous. Rendering up front in
 * `beforeAll` keeps every assertion below unchanged.
 */
const documents = new Map<string, string>();

beforeAll(async () => {
  for (const path of ['/', '/about', '/offline']) {
    documents.set(path, await renderDocument(path));
  }
});

const shell = (path: string): string => {
  const html = documents.get(path);
  if (html === undefined) throw new Error(`no document rendered for ${path}`);
  return html;
};

const shellDom = (path: string) => {
  document.body.innerHTML = shell(path);
  return within(document.body);
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('application shell', () => {
  it('emits exactly one header, main and footer, in document order', () => {
    const html = shell('/');

    for (const tag of ['header', 'main', 'footer']) {
      expect(html.match(new RegExp(`<${tag}[\\s>]`, 'gu')) ?? [], `<${tag}>`).toHaveLength(1);
    }

    expect(html.indexOf('<header')).toBeLessThan(html.indexOf('<main'));
    expect(html.indexOf('<main')).toBeLessThan(html.indexOf('<footer'));
  });

  it('exposes the document landmarks', () => {
    const dom = shellDom('/');

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
    const html = shell('/');
    const dom = shellDom('/');
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
    const banner = within(shellDom('/').getByRole('banner'));

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
    const html = shell('/');

    expect(html.slice(0, html.indexOf('<footer'))).not.toContain('<nav');
  });

  it('gives the footer two layers: a named utility nav and the site identity', () => {
    const html = shell('/');
    const dom = shellDom('/');
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
    expect(footer).toMatch(/©\s*\d{4} UMAXICA/u);
    expect(
      within(contentinfo).getByRole('link', { name: 'https://docs-jp.umaxica.app/' }),
    ).toHaveAttribute('href', 'https://docs-jp.umaxica.app/');
  });

  it('opens the document with a skip link that actually moves focus', () => {
    const dom = shellDom('/');

    const skip = dom.getByRole('link', { name: '本文へスキップ' });
    expect(skip).toHaveAttribute('href', '#main-content');

    /*
     * "First focusable element in the document" is the requirement, not "first
     * link" — a skip link a reader has to Tab to is not one. The selector is
     * every element that can take focus, so a `<button>` or a `tabindex`
     * inserted ahead of it later fails here rather than silently demoting it.
     */
    expect(document.body.querySelector('a, button, input, select, textarea, [tabindex]')).toBe(
      skip,
    );

    /*
     * The target has to exist and has to be programmatically focusable.
     * Without `tabindex="-1"` the browser scrolls to the fragment and leaves
     * focus on the link, so the next Tab returns to the header the reader just
     * asked to skip — the control appears to work and does not.
     */
    const main = dom.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabindex', '-1');
  });

  it('links only to destinations that exist', () => {
    /*
     * Anchors only, and only in the body.
     *
     * Next's Metadata API injected `<link rel="manifest">` and `<link rel="icon">`
     * at a stage this file never saw, so scanning the whole document for `href="/…"`
     * used to be equivalent to scanning for navigation. `<HeadContent />` renders
     * those same links into the document this test now receives, and a resource
     * link is not a destination a reader can navigate to — so the scan says which
     * elements it means.
     */
    const dom = shellDom('/');
    const hrefs = [...document.body.querySelectorAll('a[href^="/"]')].map((anchor) =>
      anchor.getAttribute('href'),
    );

    // Neither a privacy nor a terms route exists in this repository, and there
    // is no reusable legal text to build one from, so neither may be linked.
    expect(hrefs).not.toContain('/privacy');
    expect(hrefs).not.toContain('/terms');
    // This unit has no preference surface either.
    expect(hrefs).not.toContain('/preferences');

    expect(new Set(hrefs)).toEqual(new Set(['/', '/about']));

    // The head links are still expected to be there — they are just not
    // navigation, and the manifest URL in particular is pinned by
    // `api/standard-contract.hurl` and `e2e/standard-contract.spec.ts`.
    void dom;
    expect(shell('/')).toContain('href="/manifest.webmanifest"');
    expect(shell('/')).toContain('href="/favicon.ico"');
  });
});

/*
 * `error.tsx` and `/offline` render inside the root layout on this archetype —
 * their own comments say so — so they carry the header, the footer and the skip
 * link the layout places ahead of both. The skip link is only honest on them if
 * their `<main>` is a target too: a control that appears on a failure document
 * and lands nowhere is worse than no control.
 *
 * This is a real archetype difference and not an oversight. On the core
 * archetype the shell is scoped to the `(page)` route group, so its `error.tsx`
 * and `/offline` are genuinely chrome-free, carry no skip link, and therefore
 * have nothing to satisfy.
 */
describe('the other documents that carry this shell', () => {
  const mainOf = (markup: string) => {
    document.body.innerHTML = markup;
    return within(document.body).getByRole('main');
  };

  it('gives the error document a focusable skip-link target', () => {
    const main = mainOf(
      renderToStaticMarkup(<ErrorDocument error={new Error('boom')} reset={() => undefined} />),
    );

    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabindex', '-1');
  });

  it('gives /offline a focusable skip-link target', () => {
    const main = mainOf(renderToStaticMarkup(<components.offline />));

    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabindex', '-1');
  });
});

describe('/about', () => {
  it('renders inside the shell with its own page heading', () => {
    const html = shell('/about');

    expect(html).toContain('<h1');
    expect(html).toContain('このサイトについて');
    expect(html.match(/<main[\s>]/gu) ?? []).toHaveLength(1);
  });

  it('names the page in the title without naming the surface or the runtime', () => {
    // Next kept the bare page name here and let `metadata.title.template` close
    // it with the brand. TanStack has no template, so the route's `head()`
    // carries the finished string and `brandTitle()` is what makes it identical
    // to every other page's suffix.
    expect(headTitleOf(aboutRoute)).toBe('このサイトについて — UMAXICA (APP)');

    expectTitleContract(shell('/about'), { requirePageSpecific: true, label: '/about' });
  });
});
