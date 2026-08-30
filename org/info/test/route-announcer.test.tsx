import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BRAND_TITLE, brandTitle } from '../src/lib/title';
import { headTitleOf, indexRoute, renderApp, renderDocument } from './utils/routes';

/*
 * The route announcer, driven through a real memory-history router.
 *
 * This is a Vitest assertion rather than a Hurl one because the behaviour under
 * test does not exist in any single response: it is what the document does on
 * the SECOND navigation, after the first was served. No HTTP client can produce
 * it. `renderApp()` mounts the application and the clicks below are real
 * client-side navigations, which is the only way the effect this component owns
 * can run.
 */

const ABOUT_TITLE = brandTitle('このサイトについて');
const ERROR_DOCUMENT_TITLE = `現在、このページを表示できません — ${BRAND_TITLE}`;

/** The utility navigation in the footer is this unit's only route-to-route link. */
const utilityLink = (name: string) =>
  within(screen.getByRole('contentinfo')).getByRole('link', { name });

describe('route announcer', () => {
  it('ships the live region in the served document, empty', async () => {
    const html = await renderDocument('/');

    /*
     * Both halves matter. A live region has to be in the accessibility tree
     * before its content changes, so it must arrive with the document rather
     * than be inserted alongside the first announcement — and it must arrive
     * silent, because the browser has already announced the document itself.
     */
    expect(html).toMatch(/<output[^>]*><\/output>/u);
    expect(html).toMatch(/<output[^>]*aria-live="polite"/u);
    expect(html).toMatch(/<output[^>]*aria-atomic="true"/u);
    // `<output>` carries the `status` role implicitly, which is what makes it a
    // live region — so nothing here asserts a `role` attribute in the markup.
    expect(html).not.toContain('role="status"');
  });

  it('says nothing on the initial load', async () => {
    await renderApp('/about');

    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('announces the new document title after a client-side navigation', async () => {
    await renderApp('/');

    fireEvent.click(utilityLink('このサイトについて'));

    /*
     * The announced string is the whole `<title>`, brand suffix included —
     * exactly what the assistive technology would have read out had this been a
     * full page load rather than a `<Link>`.
     */
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(ABOUT_TITLE);
    });
    expect(document.title).toBe(ABOUT_TITLE);
  });

  it('announces each further navigation, and re-announces on return', async () => {
    const indexTitle = headTitleOf(indexRoute);
    if (indexTitle === undefined) throw new Error('the index route declares no title');
    await renderApp('/');

    fireEvent.click(utilityLink('このサイトについて'));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(ABOUT_TITLE);
    });

    // Back to the page the reader started on: the region has to change again,
    // or they are moved with no announcement at all.
    fireEvent.click(within(screen.getByRole('banner')).getByRole('link', { name: 'UMAXICA' }));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(indexTitle);
    });
  });

  it('announces the document that rendered, not the route that failed', async () => {
    const { router } = await renderApp('/');

    /*
     * A loader that throws mid-navigation is why the announced string is
     * `document.title` rather than the title the router resolved. The router
     * keeps the failed match's own `head()` title while the error document
     * renders a different `<title>` through React. Announcing the router's value
     * would tell the reader they had arrived on the very page that failed.
     */
    const about = router.routesById['/about'] as { options: { loader?: unknown } };
    const original = about.options.loader;
    about.options.loader = () => {
      throw new Error('loader failed');
    };

    try {
      fireEvent.click(utilityLink('このサイトについて'));

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(ERROR_DOCUMENT_TITLE);
      });
      expect(screen.getByRole('status')).not.toHaveTextContent(ABOUT_TITLE);
    } finally {
      about.options.loader = original;
    }
  });

  /*
   * `/health` is a server-only route: it declares no `head()` at all, so its
   * match arrives with `meta` undefined rather than with a `meta` that happens
   * to name no title. The reader still has to be told when they leave it, which
   * means the value this component seeds itself with on mount has to come out
   * as "no title" — not as a crash, and not as the previous document's title.
   */
  it('announces the move away from a route that declares no title', async () => {
    const { router } = await renderApp('/health');
    expect(screen.getByRole('status')).toHaveTextContent('');

    await act(async () => {
      await router.navigate({ to: '/' });
    });

    /*
     * Non-empty is the assertion, not the exact string. Had the titleless match
     * seeded the same value the index resolves to, the effect would compare
     * equal and the reader would be moved in silence.
     */
    await waitFor(() => {
      expect(screen.getByRole('status').textContent).not.toBe('');
    });
    expect(screen.getByRole('status')).toHaveTextContent(document.title);
  });
});
