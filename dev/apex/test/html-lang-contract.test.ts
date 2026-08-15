import { describe, expect, it } from 'vitest';
import { app } from '../src/app';
import { defaultLocale, isLocale, locales } from '../src/i18n/config';

/**
 * `<html lang>` must state the language the document is actually written in.
 *
 * This unit is the one that genuinely negotiates a locale per request, so the
 * contract has two halves: negotiated documents state what they negotiated,
 * and non-negotiated ones (the health page) state this unit's own
 * `defaultLocale`. Both used to read from ad-hoc string literals.
 */

const langOf = (html: string): string | undefined => /<html[^>]*\slang="([^"]*)"/.exec(html)?.[1];

describe('locale config', () => {
  it('treats every declared locale as a locale, and nothing else', () => {
    for (const locale of locales) {
      expect(isLocale(locale)).toBe(true);
    }

    expect(isLocale('de')).toBe(false);
    expect(isLocale('')).toBe(false);
    expect(locales).toContain(defaultLocale);
  });
});

// `/` on this unit is a 301 to the core host, so `/about` is its only
// negotiated HTML document.
describe('negotiated documents', () => {
  it('declares ja when Accept-Language prefers Japanese', async () => {
    const body = await (
      await app.request('/about', { headers: { 'Accept-Language': 'ja' } })
    ).text();

    expect(langOf(body)).toBe('ja');
  });

  it('declares the query-string locale over Accept-Language', async () => {
    const body = await (
      await app.request('/about?lang=ja', { headers: { 'Accept-Language': 'en' } })
    ).text();

    expect(langOf(body)).toBe('ja');
  });

  it('falls back to defaultLocale for a locale it does not support', async () => {
    const body = await (
      await app.request('/about?lang=de', { headers: { 'Accept-Language': 'de' } })
    ).text();

    expect(langOf(body)).toBe(defaultLocale);
  });
});

describe('non-negotiated documents', () => {
  it('renders the health page in defaultLocale', async () => {
    const body = await (await app.request('/health')).text();

    expect(langOf(body)).toBe(defaultLocale);
  });
});
