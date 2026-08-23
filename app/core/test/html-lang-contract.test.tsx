import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { NotFoundDocument } from '@/components/status-documents';
import { defaultLocale } from '@/i18n/config';

import { renderDocument } from './utils/routes';

/**
 * `<html lang>` must state the language the document is actually written in.
 *
 * `lang` drives language-dependent typography — `word-break: auto-phrase` only
 * runs on `ja` — so a wrong value silently disables the line-breaking rules in
 * this unit's stylesheet.
 *
 * The root shell derives `lang` from this unit's own `defaultLocale` rather than
 * hardcoding a second, independently-drifting copy of the same fact. Since the
 * migration there is exactly ONE root document: the not-found and error documents
 * render inside this shell — though outside the application chrome — so they
 * inherit the same `lang` rather than restating it.
 */
const langOf = (html: string): string | undefined => /<html[^>]*\slang="([^"]*)"/u.exec(html)?.[1];

describe('root shell lang', () => {
  it('declares lang from defaultLocale', async () => {
    expect(langOf(await renderDocument('/'))).toBe(defaultLocale);
  });
});

describe('not-found document', () => {
  it('inherits the shell language rather than restating it', async () => {
    const html = await renderDocument('/this-route-does-not-exist');

    expect(langOf(html)).toBe('ja');
    expect(html).toContain('ページが見つかりません');
  });

  it('renders its own copy in Japanese', () => {
    expect(renderToStaticMarkup(<NotFoundDocument />)).toContain('ページが見つかりません');
  });
});
