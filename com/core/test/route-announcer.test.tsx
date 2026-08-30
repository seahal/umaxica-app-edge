import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { defaultLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { pageTitles } from '@/lib/page-titles';
import { BRAND_TITLE } from '@/lib/title';

import { renderApp, renderDocument } from './utils/routes';

/** The `<title>` `ErrorDocument` renders, composed the same way the component does. */
const ERROR_DOCUMENT_TITLE = `現在、このページを表示できません — ${BRAND_TITLE}`;

/*
 * The route announcer, driven through a real memory-history router.
 *
 * This is a Vitest assertion rather than a Hurl one because the behaviour under
 * test does not exist in a single response: it is what the document does on the
 * SECOND navigation, after the first was served. No HTTP client can produce it.
 * `renderApp()` mounts the application and the clicks below are real client-side
 * navigations, which is the only way the effect this component owns can run.
 */

describe('route announcer', () => {
  it('ships the live region in the served document, empty', async () => {
    const html = await renderDocument('/');

    /*
     * Both halves matter. A live region has to be in the accessibility tree
     * before its content changes, so it must arrive with the document rather
     * than being injected alongside the first announcement — and it must arrive
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
    await renderApp('/explore');

    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('announces the new document title after a client-side navigation', async () => {
    const dict = await getDictionary(defaultLocale);
    await renderApp('/');

    fireEvent.click(
      within(screen.getByRole('navigation', { name: dict.nav.primary })).getByRole('link', {
        name: dict.explore.title,
      }),
    );

    /*
     * The announced string is the whole `<title>`, brand suffix included —
     * exactly what the assistive technology would have read out had this been a
     * full page load rather than a `<Link>`.
     */
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(pageTitles.explore);
    });
    expect(document.title).toBe(pageTitles.explore);
  });

  it('announces each further navigation, and re-announces on return', async () => {
    const dict = await getDictionary(defaultLocale);
    await renderApp('/');
    const nav = within(screen.getByRole('navigation', { name: dict.nav.primary }));

    fireEvent.click(nav.getByRole('link', { name: dict.messages.title }));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(pageTitles.messages);
    });

    fireEvent.click(nav.getByRole('link', { name: dict.notifications.title }));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(pageTitles.notifications);
    });

    // Back to a page already visited: the region must change again, or the
    // reader is moved with no announcement at all.
    fireEvent.click(nav.getByRole('link', { name: dict.messages.title }));
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(pageTitles.messages);
    });
  });

  it('announces the document that rendered, not the route that failed', async () => {
    const dict = await getDictionary(defaultLocale);
    const { router } = await renderApp('/');

    /*
     * A loader that throws mid-navigation is why the announced string is
     * `document.title` rather than the title the router resolved. The router
     * keeps the failed match's own `head()` title — `探索 — …` — while the error
     * document renders a different `<title>` through React. Announcing the
     * router's value would tell the reader they had arrived on the very page
     * that failed to load.
     */
    const explore = router.routesById['/_page/explore'] as { options: { loader?: unknown } };
    const original = explore.options.loader;
    explore.options.loader = () => {
      throw new Error('loader failed');
    };

    try {
      fireEvent.click(
        within(screen.getByRole('navigation', { name: dict.nav.primary })).getByRole('link', {
          name: dict.explore.title,
        }),
      );

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(ERROR_DOCUMENT_TITLE);
      });
      expect(screen.getByRole('status')).not.toHaveTextContent(pageTitles.explore);
    } finally {
      explore.options.loader = original;
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
