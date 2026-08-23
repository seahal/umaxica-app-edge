import { fireEvent, render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ErrorDocument, NotFoundDocument } from '../src/components/status-documents';
import { resetEnv, setEnv, setEnvShouldThrow } from './__mocks__/cloudflare-workers';
import { components, handlers, renderDocument } from './utils/routes';

/*
 * The failure and recovery surfaces.
 *
 * Next had three documents here — `error.tsx` inside the layout, plus
 * `global-error.tsx` and `global-not-found.tsx` which replaced it. TanStack
 * renders `errorComponent` and `notFoundComponent` inside the root shell, so
 * there are two now and both carry the shell. That is a deliberate, recorded
 * change in what a reader sees; what has not changed is the copy, the status
 * each document stands for, and the reset control's behaviour.
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
  it('renders error, offline, and not-found recovery UI', () => {
    const reset = vi.fn();
    const view = render(<ErrorDocument error={new Error('boom')} reset={reset} />);
    clickButton(view.container, '再読み込み');
    expect(reset).toHaveBeenCalledOnce();
    view.unmount();

    const Offline = components.offline;
    expect(renderToStaticMarkup(<Offline />)).toContain('オフライン');
    expect(renderToStaticMarkup(<NotFoundDocument />)).toContain('HTTP 404');
  });

  it('serves the not-found document with the shell around it', async () => {
    const html = await renderDocument('/this-route-does-not-exist');

    expect(html).toContain('HTTP 404');
    // The one visible change from the Next.js original: the 404 used to replace
    // the layout and render chrome-free. It now carries the shell.
    expect(html).toContain('本文へスキップ');
    expect(html.match(/<(header|main|footer)\b/gu)).toEqual(['<header', '<main', '<footer']);
  });

  it('keeps the skip-link target on every failure and offline document', () => {
    for (const html of [
      renderToStaticMarkup(<ErrorDocument error={new Error('boom')} reset={() => {}} />),
      renderToStaticMarkup(<NotFoundDocument />),
      renderToStaticMarkup(<components.offline />),
    ]) {
      expect(html).toContain('id="main-content"');
      expect(html).toContain('tabindex="-1"');
    }
  });

  it('returns revision metadata and falls back when the environment is unavailable', async () => {
    setEnv({ REVISION: { id: 'id-1', tag: 'tag-1', timestamp: 'ts-1' } });
    const withMeta = await handlers.revision();
    expect(withMeta.status).toBe(200);
    expect(withMeta.headers.get('Cache-Control')).toBe('no-store');
    expect(withMeta.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    await expect(withMeta.json()).resolves.toEqual({
      id: 'id-1',
      tag: 'tag-1',
      timestamp: 'ts-1',
    });

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
