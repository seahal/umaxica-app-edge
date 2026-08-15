import app from '../src/index';

const requestFromApp = (
  path: string,
  init?: RequestInit,
  env?: Record<string, unknown>,
): Response | Promise<Response> => app.request(path, init, { ...env });

/**
 * The UMAXICA application shell, asserted on the real HTTP response rather than
 * on the components, because what has to stay stable across every deployment
 * unit is the emitted document — semantics, hierarchy, accessible names — and
 * not the way this unit happens to build it.
 *
 * `/about` is the only user-facing HTML page this unit serves, so it is the
 * whole shell surface here.
 *
 * These assertions deliberately do not name a CSS class. Every visual rule is
 * a Tailwind utility now, so a class list is styling rather than structure, and
 * a test that pinned one would fail on a padding change while still passing if
 * the `<nav>` lost its accessible name. The response is parsed into a document
 * and queried by element and attribute instead.
 */
const parse = (html: string): Document =>
  // The stylesheet link is stripped before parsing: happy-dom would try to
  // fetch `/style.css` over the network, and no server answers it in a unit
  // test. The link itself is asserted on the raw response text instead.
  new DOMParser().parseFromString(html.replace(/<link rel="stylesheet"[^>]*>/g, ''), 'text/html');

describe('application shell', () => {
  const shellHtml = async (headers?: Record<string, string>) => {
    const response = await requestFromApp('/about', headers ? { headers } : undefined);
    expect(response.status).toBe(200);
    return response.text();
  };

  it('emits exactly one header, main and footer, in document order', async () => {
    const body = await shellHtml();

    for (const tag of ['header', 'main', 'footer']) {
      expect(body.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? [], `<${tag}>`).toHaveLength(1);
    }

    // DOM order must match the visual order the contract describes.
    expect(body.indexOf('<header')).toBeLessThan(body.indexOf('<main'));
    expect(body.indexOf('<main')).toBeLessThan(body.indexOf('<footer'));
  });

  it('links the brand to this edition’s homepage without stealing the page heading', async () => {
    const doc = parse(await shellHtml());
    const brand = doc.querySelector('header a');

    expect(brand?.getAttribute('href')).toBe('/');
    expect(brand?.textContent).toBe('UMAXICA');

    // The `<h1>` belongs to the page, inside `<main>` — not to the header.
    expect(doc.querySelector('header h1')).toBeNull();
    expect(doc.querySelector('main h1')).not.toBeNull();
  });

  it('renders the brand name from env', async () => {
    const response = await requestFromApp('/about', {}, { BRAND_NAME: 'UMAXICA TEST' });
    const doc = parse(await response.text());

    expect(doc.querySelector('header a')?.textContent).toBe('UMAXICA TEST');
  });

  it('ships no dead control in the header', async () => {
    const doc = parse(await shellHtml());

    /*
     * The actions slot itself is not asserted: it is an empty `<div>` and an
     * empty `<div>` has no semantics to assert once its class list stopped
     * being structure. What the contract actually forbids is a control that
     * does nothing — nothing here toggles, so the header holds the brand link
     * and nothing else interactive.
     */
    expect(doc.querySelectorAll('header a')).toHaveLength(1);
    expect(doc.querySelector('header button')).toBeNull();
  });

  it('renders no main navigation, because this unit has no second destination', async () => {
    const body = await shellHtml();
    const beforeFooter = body.slice(0, body.indexOf('<footer'));

    expect(beforeFooter).not.toContain('<nav');
  });

  it('gives the footer two layers: a named utility nav and the site identity', async () => {
    const body = await shellHtml();
    const doc = parse(body);
    const footer = doc.querySelector('footer');
    const utility = footer?.querySelector('nav');

    expect(utility?.getAttribute('aria-label')).toBe('Utility navigation');
    expect(utility?.querySelector('a')?.getAttribute('href')).toBe('/about');
    expect(utility?.querySelector('a')?.textContent).toBe('About');

    // Utility navigation precedes the identity row.
    const identity = footer?.querySelector('p');
    expect(identity?.textContent).toMatch(/©\s*\d{4} UMAXICA/);
    expect(utility && identity ? utility.compareDocumentPosition(identity) : 0).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );

    const canonical = identity?.querySelector('a');
    expect(canonical?.getAttribute('href')).toBe('https://umaxica.net/');
    expect(canonical?.textContent).toBe('https://umaxica.net/');
  });

  it('localises the shell through the existing language detector', async () => {
    const doc = parse(await shellHtml({ 'Accept-Language': 'ja' }));
    const utility = doc.querySelector('footer nav');

    expect(utility?.getAttribute('aria-label')).toBe('ユーティリティナビゲーション');
    expect(utility?.querySelector('a')?.textContent).toBe('このサイトについて');
  });

  it('links only to destinations that exist', async () => {
    const body = await shellHtml();
    const hrefs = [...body.matchAll(/href="(\/[^"]*)"/g)].map((match) => match[1]);

    // No Privacy, Terms or Preferences surface exists on this unit, so the
    // shell must not pretend otherwise.
    expect(hrefs).not.toContain('/privacy');
    expect(hrefs).not.toContain('/terms');
    expect(hrefs).not.toContain('/preferences');

    const served = new Set([
      '/',
      '/about',
      '/favicon.ico',
      '/manifest.webmanifest',
      // Tailwind's output, compiled by `build:css` and served by the assets
      // binding from ./public.
      '/style.css',
    ]);
    for (const href of hrefs) {
      if (href.endsWith('.js')) continue; // asset, served from ./public
      expect(served, `dead link: ${href}`).toContain(href);
    }
  });

  it('styles every document from one compiled stylesheet, with nothing inline', async () => {
    const body = await shellHtml();

    /*
     * The CSS used to be an inline `<style>` whose sha256 was hand-maintained
     * in the CSP. It is a static asset now, so no document may carry an inline
     * stylesheet or an inline `style` attribute — the CSP's `style-src-attr
     * 'none'` would drop the latter anyway.
     */
    expect(body).toContain('<link rel="stylesheet" href="/style.css"');
    expect(body).not.toContain('<style');
    expect(body).not.toMatch(/\sstyle="/);
  });

  it('leaves /health outside the shell — it is a health check, not a page', async () => {
    const response = await requestFromApp('/health');

    expect(response.status).toBe(200);
    const body = await response.text();

    expect(body).not.toContain('<header');
    expect(body).not.toContain('<nav');
    expect(body).not.toContain('<a href="/about">');
    // It is chrome-free, not unstyled: it links the same compiled stylesheet.
    expect(body).toContain('<link rel="stylesheet" href="/style.css"');
  });
});
