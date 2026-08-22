import { fireEvent, render, screen } from '@testing-library/react';
import type * as NextServer from 'next/server';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  checkRailsLiveness: vi.fn(),
  connection: vi.fn(),
  getCloudflareContext: vi.fn(),
  getRailsClient: vi.fn(() => ({ request: vi.fn() })),
  notFound: vi.fn(),
}));

vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: 'font-sans' }),
}));

vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
  // `AppChrome` reads the pathname to place `aria-current="page"`. This file
  // asserts what the shell renders, not which entry is marked — that is
  // `test/ui-shell-contract.test.tsx` — so one fixed route is enough.
  usePathname: () => '/',
}));

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof NextServer>()),
  connection: mocks.connection,
}));

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: mocks.getCloudflareContext,
}));

vi.mock('../src/lib/rails-client', () => ({
  getRailsClient: mocks.getRailsClient,
}));

vi.mock('../src/lib/rails-health', () => ({
  checkRailsLiveness: mocks.checkRailsLiveness,
}));

const RAILS_OK = { liveness: { kind: 'ok', status: 200, latency_ms: 3 } } as const;

import PageLayout from '../src/app/(page)/layout';
import GlobalError from '../src/app/global-error';
import GlobalNotFound from '../src/app/global-not-found';
import { GET as getHealth } from '../src/app/health/route';
import RootLayout, { metadata } from '../src/app/layout';
import Loading from '../src/app/loading';
import manifest from '../src/app/manifest';
import robots from '../src/app/robots';
import sitemap from '../src/app/sitemap';
import UnauthorizedPage from '../src/app/unauthorized';
import { defaultLocale, isLocale, locales } from '../src/i18n/config';
import { getDictionary } from '../src/i18n/dictionaries';

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('app/core application shell', () => {
  it('renders user-visible status and layout content', async () => {
    const reset = vi.fn();
    render(<GlobalError error={new Error('boom')} reset={reset} />, { container: document });
    fireEvent.click(screen.getByRole('button', { name: '再読み込み' }));
    expect(reset).toHaveBeenCalledOnce();

    expect(renderToStaticMarkup(<GlobalNotFound />)).toContain('HTTP 404');
    expect(renderToStaticMarkup(<Loading />)).toContain('Loading...');
    expect(renderToStaticMarkup(<UnauthorizedPage />)).toContain('401 - Unauthorized');
    expect(renderToStaticMarkup(<RootLayout>content</RootLayout>)).toContain('content');

    const pageLayout = await PageLayout({ children: <p>workspace content</p> });
    const pageHtml = renderToStaticMarkup(pageLayout);
    // The navigation is asserted in full by test/ui-shell-contract.test.tsx.
    expect(pageHtml).toContain('id="main-navigation"');
    expect(pageHtml).toContain('workspace content');
  });

  it('returns the public metadata documents', () => {
    expect(metadata).toMatchObject({
      title: { default: 'UMAXICA (APP)', template: '%s — UMAXICA (APP)' },
    });
    expect(manifest()).toMatchObject({ start_url: '/', display: 'standalone' });
    expect(robots()).toMatchObject({ sitemap: 'https://jp.umaxica.app/sitemap.xml' });
    expect(sitemap()).toEqual([
      expect.objectContaining({ url: 'https://jp.umaxica.app', changeFrequency: 'weekly' }),
    ]);
  });
});

describe('app/core locale selection', () => {
  it('recognizes supported locales and loads both dictionaries', async () => {
    expect(defaultLocale).toBe('ja');
    expect(locales).toEqual(['en', 'ja']);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('ja')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    await expect(getDictionary('en')).resolves.toHaveProperty('home');
    await expect(getDictionary()).resolves.toHaveProperty('home');
  });

  it('delegates unsupported locales to the Next.js not-found boundary', async () => {
    mocks.notFound.mockImplementationOnce(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
    await expect(getDictionary('fr')).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });
});

describe('app/core health route', () => {
  it('reports revision identity, Rails liveness and no-store headers', async () => {
    mocks.getCloudflareContext.mockReturnValue({
      env: { REVISION: { id: 'revision-id', tag: 'revision-tag', timestamp: 'built-at' } },
    });
    mocks.checkRailsLiveness.mockResolvedValueOnce(RAILS_OK);

    const response = await getHealth();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    await expect(response.json()).resolves.toMatchObject({
      status: 'ok',
      edge: {
        status: 'ok',
        version: { id: 'revision-id', tag: 'revision-tag', timestamp: 'built-at' },
      },
      rails: RAILS_OK,
    });
  });

  it('returns a service-unavailable document when revision context fails', async () => {
    mocks.checkRailsLiveness.mockResolvedValueOnce(RAILS_OK);
    mocks.getCloudflareContext.mockImplementationOnce(() => {
      throw new Error('context unavailable');
    });

    const response = await getHealth();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: 'error',
      edge: { status: 'error' },
      // The Edge half failing must not hide the Rails half.
      rails: RAILS_OK,
    });
  });

  it.each([
    ['ok', 200],
    ['http-error', 503],
    ['unreachable', 503],
    ['not-configured', 503],
  ] as const)('maps Rails liveness %s to HTTP %i', async (kind, status) => {
    mocks.getCloudflareContext.mockReturnValue({ env: {} });
    mocks.checkRailsLiveness.mockResolvedValueOnce({ liveness: { kind, latency_ms: 1 } });

    const response = await getHealth();
    expect(mocks.connection).toHaveBeenCalledOnce();
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({
      status: kind === 'ok' ? 'ok' : 'error',
      rails: { liveness: { kind } },
    });
  });
});
