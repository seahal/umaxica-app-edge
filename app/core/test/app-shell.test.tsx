import { fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as NextServer from 'next/server';

const mocks = vi.hoisted(() => ({
  checkRailsHealth: vi.fn(),
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
  checkRailsHealth: mocks.checkRailsHealth,
}));

import GlobalError from '../src/app/global-error';
import GlobalNotFound from '../src/app/global-not-found';
import { GET as getHealth } from '../src/app/health/route';
import RootLayout, { metadata } from '../src/app/layout';
import Loading from '../src/app/loading';
import manifest from '../src/app/manifest';
import PageLayout from '../src/app/(page)/layout';
import { GET as getRailsHealth } from '../src/app/rails-health/route';
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
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledOnce();

    expect(renderToStaticMarkup(<GlobalNotFound />)).toContain('Page not found.');
    expect(renderToStaticMarkup(<Loading />)).toContain('Loading...');
    expect(renderToStaticMarkup(<UnauthorizedPage />)).toContain('401 - Unauthorized');
    expect(renderToStaticMarkup(<RootLayout>content</RootLayout>)).toContain('content');

    const pageLayout = await PageLayout({ children: <p>workspace content</p> });
    const pageHtml = renderToStaticMarkup(pageLayout);
    expect(pageHtml).toContain('Rails health');
    expect(pageHtml).toContain('workspace content');
  });

  it('returns the public metadata documents', () => {
    expect(metadata).toMatchObject({ title: 'UMAXICA (app)' });
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

describe('app/core health routes', () => {
  it('reports revision identity and no-store headers', async () => {
    mocks.getCloudflareContext.mockReturnValue({
      env: { REVISION: { id: 'revision-id', tag: 'revision-tag', timestamp: 'built-at' } },
    });

    const response = await getHealth();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    await expect(response.json()).resolves.toMatchObject({
      status: 'ok',
      version: { id: 'revision-id', tag: 'revision-tag', timestamp: 'built-at' },
    });
  });

  it('returns a service-unavailable document when revision context fails', async () => {
    mocks.getCloudflareContext.mockImplementationOnce(() => {
      throw new Error('context unavailable');
    });

    const response = await getHealth();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ status: 'error' });
  });

  it.each([
    [{ kind: 'ok', status: 200 }, 200],
    [{ kind: 'unavailable', status: 503 }, 503],
  ] as const)('maps Rails health %o to HTTP %i', async (result, status) => {
    mocks.checkRailsHealth.mockResolvedValueOnce(result);
    const response = await getRailsHealth();
    expect(mocks.connection).toHaveBeenCalledOnce();
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ rails: result });
  });
});
