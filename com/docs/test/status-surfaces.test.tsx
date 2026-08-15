import { createElement } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  setCloudflareContext,
  setCloudflareContextShouldThrow,
} from './__mocks__/opennext-cloudflare';
import ErrorPage from '../src/app/error';
import OfflinePage from '../src/app/offline/page';
import GlobalNotFound from '../src/app/global-not-found';
import GlobalError from '../src/app/global-error';
import { GET } from '../src/app/revision/route';

function clickButton(container: HTMLElement, label: string) {
  const button = Array.from(container.querySelectorAll('button')).find(
    (node) => node.textContent?.trim() === label,
  );
  expect(button).toBeTruthy();
  fireEvent.click(button as HTMLButtonElement);
}

afterEach(() => {
  vi.restoreAllMocks();
  setCloudflareContext({ env: {} });
  setCloudflareContextShouldThrow(false);
  document.body.innerHTML = '';
});

describe('status surfaces', () => {
  it('renders error, offline, and not-found recovery UI', () => {
    const reset = vi.fn();
    const view = render(createElement(ErrorPage, { error: new Error('boom'), reset }));
    clickButton(view.container, '再読み込み');
    expect(reset).toHaveBeenCalledOnce();
    view.unmount();

    expect(renderToStaticMarkup(createElement(OfflinePage))).toContain('オフライン');
    expect(renderToStaticMarkup(createElement(GlobalNotFound))).toContain('HTTP 404');
  });

  it('renders global-error recovery UI', () => {
    const reset = vi.fn();
    const view = render(createElement(GlobalError, { error: new Error('boom'), reset }));
    clickButton(view.container, '再読み込み');
    expect(reset).toHaveBeenCalledOnce();
    view.unmount();
  });

  it('returns revision metadata and falls back when context is unavailable', async () => {
    setCloudflareContext({
      env: { REVISION: { id: 'id-1', tag: 'tag-1', timestamp: 'ts-1' } },
    });
    const withMeta = GET();
    expect(withMeta.status).toBe(200);
    expect(withMeta.headers.get('Cache-Control')).toBe('no-store');
    expect(withMeta.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    await expect(withMeta.json()).resolves.toEqual({
      id: 'id-1',
      tag: 'tag-1',
      timestamp: 'ts-1',
    });

    setCloudflareContext({ env: {} });
    await expect(GET().json()).resolves.toEqual({ id: null, tag: null, timestamp: null });

    setCloudflareContextShouldThrow(true);
    await expect(GET().json()).resolves.toEqual({ id: null, tag: null, timestamp: null });
  });
});
