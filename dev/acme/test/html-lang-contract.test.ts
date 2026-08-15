import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import Layout from '../src/app/layout';
import GlobalError from '../src/app/global-error';
import { defaultLocale } from '../src/i18n/config';

/**
 * `<html lang>` must state the language the document is actually written in.
 *
 * Unlike the ja units, this one's own copy is English, so `defaultLocale` is
 * `en` — and its Japanese error document correctly declares `ja` for itself
 * rather than inheriting the root's answer. Both halves are pinned here so
 * neither can drift into the other.
 */

const langOf = (html: string): string | undefined => /<html[^>]*\slang="([^"]*)"/.exec(html)?.[1];

/** Kana and CJK ideographs — present in Japanese copy, absent from English. */
const JAPANESE = /[぀-ゟ゠-ヿ一-龯]/;

describe('root layout lang', () => {
  it('declares lang from defaultLocale', () => {
    const html = renderToStaticMarkup(
      createElement(Layout as never, null, createElement('p', null, 'body')),
    );

    expect(langOf(html)).toBe(defaultLocale);
  });

  it('declares the language its own shell is written in', () => {
    expect(defaultLocale).toBe('en');
  });
});

describe('global-error lang', () => {
  it('declares the language of its own copy', () => {
    const html = renderToStaticMarkup(
      createElement(GlobalError as never, {
        error: new Error('boom'),
        reset: () => {},
      }),
    );

    expect(langOf(html)).toBe('ja');
    expect(html).toMatch(JAPANESE);
    expect(langOf(html)).not.toBe(defaultLocale);
  });
});
