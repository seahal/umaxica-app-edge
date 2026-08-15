/** @jsxImportSource hono/jsx */
import { describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import app from '../src/index';
import type { ApexEnv } from '../src/create-apex-app';
import { renderer } from '../src/renderer';
import { defaultLocale } from '../src/i18n/config';

/**
 * `<html lang>` must state the language the document is actually written in.
 *
 * This unit emits HTML from four places — the JSX renderer, the health page,
 * the status pages and the offline page — and each one used to hardcode its
 * own copy of `ja`. They now derive it from this unit's own `defaultLocale`,
 * and this file pins that every emitter agrees.
 *
 * It matters beyond correctness of the attribute: `word-break: auto-phrase` in
 * `src/style.css` only runs on Japanese text, and the engine decides
 * that from `lang`.
 */

const langOf = (html: string): string | undefined => /<html[^>]*\slang="([^"]*)"/.exec(html)?.[1];

/** Kana and CJK ideographs — present in Japanese copy, absent from English. */
const JAPANESE = /[぀-ゟ゠-ヿ一-龯]/;

describe('apex lang contract', () => {
  it('declares the language its own status copy is written in', () => {
    expect(defaultLocale).toBe('ja');
  });

  it('renders the page shell in defaultLocale', async () => {
    const shell = new Hono<ApexEnv>();
    shell.use(renderer);
    shell.get('/', (c) => c.render(<p>本文</p>));

    const body = await (await shell.request('/')).text();

    expect(langOf(body)).toBe(defaultLocale);
  });

  it('renders the health page in defaultLocale', async () => {
    const body = await (await app.request('/health')).text();

    expect(langOf(body)).toBe(defaultLocale);
  });

  it('renders the not-found page in defaultLocale, matching its copy', async () => {
    const response = await app.request('/this-route-does-not-exist');
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(langOf(body)).toBe(defaultLocale);
    expect(body).toMatch(JAPANESE);
  });

  it('renders the offline page in defaultLocale, matching its copy', async () => {
    const body = await (await app.request('/offline')).text();

    expect(langOf(body)).toBe(defaultLocale);
    expect(body).toMatch(JAPANESE);
  });
});
