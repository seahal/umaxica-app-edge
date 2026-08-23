import { fireEvent, render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ErrorDocument, NotFoundDocument } from '@/components/status-documents';

import { resetEnv, setEnv, setEnvShouldThrow } from './__mocks__/cloudflare-workers';
import { handlers, renderDocument } from './utils/routes';

/*
 * The failure and offline surfaces.
 *
 * Next had `error.tsx`, `global-error.tsx` and `global-not-found.tsx`, all
 * outside the `(page)` route group so they stayed chrome-free. TanStack renders
 * `errorComponent` and `notFoundComponent` inside the root shell but OUTSIDE
 * `src/routes/_page.tsx`, the pathless layout that carries the chrome — so this
 * frame keeps exactly the shape it had, which is what
 * `docs/design/ui-shell-contract.md` §15 asks for.
 */
function clickButton(container: HTMLElement, label: string) {
  const button = Array.from(container.querySelectorAll('button')).find(
    (node) => node.textContent?.trim() === label,
  );
  expect(button).toBeTruthy();
  fireEvent.click(button as HTMLButtonElement);
}

afterEach(() => {
  vi.restoreAllMocks();
  resetEnv();
  document.body.innerHTML = '';
});

describe('status surfaces', () => {
  it('renders error, offline, and not-found recovery UI', async () => {
    const reset = vi.fn();
    const view = render(<ErrorDocument error={new Error('boom')} reset={reset} />);
    clickButton(view.container, '再読み込み');
    expect(reset).toHaveBeenCalledOnce();
    view.unmount();

    expect(renderToStaticMarkup(<NotFoundDocument />)).toContain('HTTP 404');
    expect(await renderDocument('/offline')).toContain('オフラインです');
  });

  it('keeps the failure and offline documents chrome-free', async () => {
    for (const html of [
      await renderDocument('/this-route-does-not-exist'),
      await renderDocument('/offline'),
    ]) {
      expect(html).not.toContain('<header');
      expect(html).not.toContain('<footer');
      expect(html).not.toContain('id="main-navigation"');
    }
  });

  it('returns revision metadata and falls back when the environment is unavailable', async () => {
    setEnv({ REVISION: { id: 'id-1', tag: 'tag-1', timestamp: 'ts-1' } });
    const withMeta = await handlers.revision();
    expect(withMeta.status).toBe(200);
    expect(withMeta.headers.get('Cache-Control')).toBe('no-store');
    expect(withMeta.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    await expect(withMeta.json()).resolves.toEqual({ id: 'id-1', tag: 'tag-1', timestamp: 'ts-1' });

    setEnv({});
    await expect((await handlers.revision()).json()).resolves.toEqual({
      id: null,
      tag: null,
      timestamp: null,
    });

    setEnvShouldThrow(true);
    await expect((await handlers.revision()).json()).resolves.toEqual({
      id: null,
      tag: null,
      timestamp: null,
    });
  });
});
