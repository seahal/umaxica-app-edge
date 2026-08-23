import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { defaultLocale } from '../src/i18n/config';
import { components, renderDocument } from './utils/routes';

/**
 * `<html lang>` must state the language the document is actually written in.
 *
 * This frame used to declare `en` at the root while shipping Japanese copy in
 * every error and offline surface, which is exactly the drift this file exists to
 * stop: `lang` drives language-dependent typography (`word-break: auto-phrase`
 * only runs on `ja`), so a wrong value silently disables the line-breaking rules
 * in this unit's stylesheet.
 *
 * The root shell derives `lang` from this unit's own `defaultLocale` rather than
 * hardcoding a second, independently-drifting copy of the same fact. Since the
 * migration there is exactly ONE root document: the not-found and error
 * documents render inside this shell instead of replacing it, so they inherit
 * the same `lang` rather than restating it.
 */
const langOf = (html: string): string | undefined => /<html[^>]*\slang="([^"]*)"/u.exec(html)?.[1];

/** Kana and CJK ideographs — present in Japanese copy, absent from English. */
const JAPANESE = /[぀-ゟ゠-ヿ一-龯]/u;

describe('root shell lang', () => {
  it('declares lang from defaultLocale', async () => {
    expect(langOf(await renderDocument('/'))).toBe(defaultLocale);
  });

  it('declares the language its own page copy is written in', () => {
    // The half that a derivation alone cannot pin: `defaultLocale` could be
    // changed to any locale and stay self-consistent while the copy stayed
    // Japanese. This asserts the two agree.
    const Home = components.index;

    expect(renderToStaticMarkup(<Home />)).toMatch(JAPANESE);
    expect(defaultLocale).toBe('ja');
  });
});

describe('not-found document', () => {
  it('inherits the shell language rather than restating it', async () => {
    const html = await renderDocument('/this-route-does-not-exist');

    expect(langOf(html)).toBe('ja');
    expect(html).toContain('ページが見つかりません');
  });
});
