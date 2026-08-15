import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: 'font-sans' }),
}));

import Layout from '../src/app/layout';
import Home from '../src/app/page';
import NotFound from '../src/app/global-not-found';
import { defaultLocale } from '../src/i18n/config';

/**
 * `<html lang>` must state the language the document is actually written in.
 *
 * This frame used to declare `en` at the root while shipping Japanese copy in
 * every error and offline surface, which is exactly the drift this file
 * exists to stop: `lang` drives language-dependent typography
 * (`word-break: auto-phrase` only runs on `ja`, `hyphens` only on Latin), so a
 * wrong value silently disables the line-breaking rules in this unit's stylesheet.
 *
 * The root layout derives `lang` from this unit's own `defaultLocale` rather
 * than hardcoding a second, independently-drifting copy of the same fact.
 * Documents that replace the root layout state the language of their own copy.
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

  it('declares the language its own page copy is written in', () => {
    // The half that a derivation alone cannot pin: `defaultLocale` could be
    // changed to any locale and stay self-consistent while the copy stayed
    // Japanese. This asserts the two agree.
    const page = renderToStaticMarkup(createElement(Home as never));

    expect(page).toMatch(JAPANESE);
    expect(defaultLocale).toBe('ja');
  });
});

describe('global-not-found lang', () => {
  it('declares the language of its own copy', () => {
    const html = renderToStaticMarkup(createElement(NotFound as never));

    // This document replaces the root layout and hardcodes Japanese copy, so
    // it states `ja` directly rather than deriving from defaultLocale.
    expect(langOf(html)).toBe('ja');
    expect(html).toContain('ページが見つかりません');
  });
});
