import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: 'font-sans' }),
}));

import Layout from '../src/app/layout';
import NotFound from '../src/app/global-not-found';
import { defaultLocale } from '../src/i18n/config';

/**
 * `<html lang>` must state the language the document is actually written in.
 *
 * This app renders its body copy from the ja/en dictionaries, so its root
 * layout derives `lang` from `defaultLocale` rather than hardcoding a second,
 * independently-drifting copy of the same fact. These tests pin that
 * derivation: changing `defaultLocale` alone must not leave `lang` behind.
 */

const langOf = (html: string): string | undefined => /<html[^>]*\slang="([^"]*)"/.exec(html)?.[1];

describe('root layout lang', () => {
  it('declares lang from defaultLocale', () => {
    const html = renderToStaticMarkup(
      createElement(Layout as never, null, createElement('p', null, 'body')),
    );

    expect(langOf(html)).toBe(defaultLocale);
  });
});

describe('global-not-found lang', () => {
  it('declares the language of its own copy', () => {
    const html = renderToStaticMarkup(createElement(NotFound as never));

    // This document replaces the root layout and hardcodes Japanese copy, so it
    // states `ja` directly rather than deriving from defaultLocale.
    expect(langOf(html)).toBe('ja');
    expect(html).toContain('ページが見つかりません');
  });
});
