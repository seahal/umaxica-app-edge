import { describe, expect, it, vi } from 'vitest';
// @ts-expect-error React is provided by the app workspace, not the root package.
import { createElement } from '../app/core/node_modules/react';
import { renderToStaticMarkup } from '../app/core/node_modules/react-dom/server';

vi.mock('../app/core/node_modules/next/font/google', () => ({
  Inter: () => ({ variable: 'font-sans' }),
}));

import AppCoreLayout from '../app/core/src/app/layout';
import ComCoreLayout from '../com/core/src/app/layout';
import OrgCoreLayout from '../org/core/src/app/layout';
import AppCoreNotFound from '../app/core/src/app/global-not-found';
import ComCoreNotFound from '../com/core/src/app/global-not-found';
import OrgCoreNotFound from '../org/core/src/app/global-not-found';
import { defaultLocale as appLocale } from '../app/core/src/i18n/config';
import { defaultLocale as comLocale } from '../com/core/src/i18n/config';
import { defaultLocale as orgLocale } from '../org/core/src/i18n/config';

/**
 * `<html lang>` must state the language the document is actually written in.
 *
 * The core apps render their body copy from the ja/en dictionaries, so their
 * root layout derives `lang` from `defaultLocale` rather than hardcoding a
 * second, independently-drifting copy of the same fact. These tests pin that
 * derivation: changing `defaultLocale` alone must not leave `lang` behind.
 *
 * Scope note: the satellite apps (docs/help/info/news) still render a few
 * hardcoded Japanese strings under `lang="en"`. That is a known, separately
 * tracked inconsistency and is deliberately not asserted here.
 */

const langOf = (html: string): string | undefined => /<html[^>]*\slang="([^"]*)"/.exec(html)?.[1];

const coreApps = [
  ['app/core', AppCoreLayout, appLocale],
  ['com/core', ComCoreLayout, comLocale],
  ['org/core', OrgCoreLayout, orgLocale],
] as const;

describe('core root layout lang', () => {
  it.each(coreApps)('%s declares lang from defaultLocale', (_workspace, Layout, locale) => {
    const html = renderToStaticMarkup(
      createElement(Layout as never, null, createElement('p', null, 'body')),
    );

    expect(langOf(html)).toBe(locale);
  });
});

const coreNotFound = [
  ['app/core', AppCoreNotFound],
  ['com/core', ComCoreNotFound],
  ['org/core', OrgCoreNotFound],
] as const;

describe('core global-not-found lang', () => {
  it.each(coreNotFound)('%s declares the language of its own copy', (_workspace, NotFound) => {
    const html = renderToStaticMarkup(createElement(NotFound as never));

    // This document replaces the root layout and hardcodes Japanese copy, so it
    // states `ja` directly rather than deriving from defaultLocale.
    expect(langOf(html)).toBe('ja');
    expect(html).toContain('ページが見つかりません');
  });
});
