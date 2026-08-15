import { readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expectTitleContract, FORBIDDEN_TOKEN, resolveTitle, TLD } from './utils/title-contract';

vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: 'font-sans' }),
}));

// Statically imported: it calls next/font at module scope, and only a static
// import participates in the vi.mock registry above.
import * as rootLayout from '../src/app/layout';

const appDir = resolve(import.meta.dirname, '..', 'src', 'app');

/** Every page.tsx this unit routes, relative to src/app. */
function pageFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'page.tsx') out.push(relative(appDir, full).split('\\').join('/'));
    }
  };
  walk(appDir);
  return out.sort();
}

/**
 * `(page)/home/page.tsx` only calls `redirect()`, and a redirect renders no
 * HTML, so it is explicitly outside the title contract.
 */
const REDIRECT_ONLY = new Set(['(page)/home/page.tsx']);

const isIndexPage = (file: string) => file === 'page.tsx' || file === '(page)/page.tsx';

const pages = pageFiles().filter((file) => !REDIRECT_ONLY.has(file));

describe('root layout metadata', () => {
  it('declares a contract-conforming title', () => {
    const title = (
      rootLayout as unknown as { metadata: { title: { default: string; template: string } } }
    ).metadata.title;

    expect(title, 'title must use default + template').toBeTypeOf('object');
    expect(title.default).toBe(`UMAXICA (DEV)`);
    expect(title.template).toBe(`%s — UMAXICA (${TLD})`);

    // The default is itself a rendered title and must satisfy the contract.
    expectTitleContract(`<title>${title.default}</title>`, { label: 'root title' });
  });
});

describe('page title regression guard', () => {
  it('routes at least one page', () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it.each(pages.filter((file) => !isIndexPage(file)))(
    '%s declares its own page-specific title',
    async (file) => {
      const module = (await import(/* @vite-ignore */ `../src/app/${file}`)) as Record<
        string,
        unknown
      >;

      expect(
        module.metadata !== undefined || module.generateMetadata !== undefined,
        `${file}: exports neither metadata nor generateMetadata — a new page must declare a title`,
      ).toBe(true);

      const title = await resolveTitle(module);

      // Rejects metadata = {}, title: '', title: '   ', and title: undefined.
      expect(typeof title, `${file}: resolved title is not a string`).toBe('string');
      expect((title ?? '').trim(), `${file}: resolved title is empty`).not.toBe('');
      expect(title, `${file}: repeats the root title instead of naming the page`).not.toBe(
        `UMAXICA (${TLD})`,
      );
      expect(title, `${file}: page title leaks a surface/runtime name`).not.toMatch(
        FORBIDDEN_TOKEN,
      );
    },
  );

  it.each(pages.filter(isIndexPage))('%s may inherit a contract-conforming root title', (file) => {
    expectTitleContract(`<title>UMAXICA (DEV)</title>`, {
      label: `${file} inherited root title`,
    });
  });
});

describe('global-error document', () => {
  it('renders a non-empty <title> in its final HTML', async () => {
    const module = (await import('../src/app/global-error')) as Record<string, unknown>;

    // A client component cannot export metadata, so the title is asserted on the
    // rendered output rather than on any exported value.
    const html = renderToStaticMarkup(
      createElement(module.default as never, {
        error: Object.assign(new Error('boom'), { digest: 'test' }),
        reset: () => {},
      }),
    );

    expectTitleContract(html, { requirePageSpecific: true, label: 'global-error' });
  });
});
