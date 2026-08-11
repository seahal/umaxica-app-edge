import { fireEvent, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const notFound = vi.hoisted(() => vi.fn());
vi.mock('next/font/google', () => ({ Inter: () => ({ variable: 'font-sans' }) }));
vi.mock('next/navigation', () => ({ notFound }));

import GlobalError from '../src/app/global-error';
import GlobalNotFound from '../src/app/global-not-found';
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
});

describe('com/core application shell', () => {
  it('renders recovery, status, and root layout behavior', () => {
    const reset = vi.fn();
    render(<GlobalError error={new Error('boom')} reset={reset} />, { container: document });
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledOnce();

    expect(renderToStaticMarkup(<GlobalNotFound />)).toContain('Page not found.');
    expect(renderToStaticMarkup(<Loading />)).toContain('Loading...');
    expect(renderToStaticMarkup(<UnauthorizedPage />)).toContain('Unauthorized');
    expect(renderToStaticMarkup(<RootLayout>content</RootLayout>)).toContain('content');
  });

  it('returns metadata and crawler documents for the com origin', () => {
    expect(metadata).toMatchObject({ title: 'UMAXICA (com)' });
    expect(manifest()).toMatchObject({ start_url: '/', display: 'standalone' });
    expect(robots()).toMatchObject({ sitemap: 'https://jp.umaxica.com/sitemap.xml' });
    expect(sitemap()).toEqual([expect.objectContaining({ url: 'https://jp.umaxica.com' })]);
  });

  it('loads supported dictionaries and rejects unsupported locales', async () => {
    expect(defaultLocale).toBe('ja');
    expect(locales).toEqual(['en', 'ja']);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    await expect(getDictionary('en')).resolves.toHaveProperty('home');
    await expect(getDictionary()).resolves.toHaveProperty('home');

    notFound.mockImplementationOnce(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
    await expect(getDictionary('fr')).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
