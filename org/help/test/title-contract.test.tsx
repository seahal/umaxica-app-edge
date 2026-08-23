import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ErrorDocument } from '../src/components/status-documents';
import { rateLimitedResponse } from '../src/rate-limit';
import { headTitleOf, renderDocument, rootRoute } from './utils/routes';
import { expectTitleContract, FORBIDDEN_TOKEN, TLD } from './utils/title-contract';

/*
 * The `<title>` contract, asserted on rendered documents rather than on exported
 * metadata.
 *
 * Next resolved `metadata.title.default` and `metadata.title.template` into one
 * string, so the old version of this file could assert on the exported objects.
 * TanStack has neither: a route's `head()` returns a finished title and
 * `<HeadContent />` renders it, so the only place the contract is observable is
 * the document. Every case below therefore renders through a real router — which
 * is also what catches the failure mode the migration actually hit, two `<title>`
 * elements in one document.
 */

const routesDir = resolve(import.meta.dirname, '..', 'src', 'routes');

/**
 * Every route that renders an HTML document, and the URL it answers.
 *
 * Derived from disk rather than listed, so a new page route joins the contract
 * by existing. `.ts` route files are server routes — they return JSON, XML or
 * plain text and carry no title — and `__root` is the shell rather than a page.
 */
function documentRoutes(): { file: string; path: string }[] {
  return readdirSync(routesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx') && entry.name !== '__root.tsx')
    .map((entry) => {
      const base = entry.name.replace(/\.tsx$/u, '');
      return { file: entry.name, path: base === 'index' ? '/' : `/${base}` };
    })
    .sort((a, b) => a.file.localeCompare(b.file));
}

const documents = documentRoutes();
const isIndex = (file: string) => file === 'index.tsx';

describe('root route', () => {
  // Load-bearing rather than incidental: `<HeadContent />` renders the head tags
  // of every matched route, and React hoists a `<title>` a component renders on
  // top of that. A root title plus a not-found document's own title produced TWO
  // `<title>` elements — measured — and the contract allows exactly one.
  it('contributes no title of its own', () => {
    expect(headTitleOf(rootRoute)).toBeUndefined();
  });
});

describe('page title regression guard', () => {
  it('routes at least one document', () => {
    expect(documents.length).toBeGreaterThan(0);
  });

  it.each(documents)('$file serves a contract-conforming document', async ({ file, path }) => {
    expectTitleContract(await renderDocument(path), {
      requirePageSpecific: !isIndex(file),
      label: file,
    });
  });

  it.each(documents.filter(({ file }) => !isIndex(file)))(
    '$file declares its own page-specific title rather than inheriting one',
    async ({ file, path }) => {
      const html = await renderDocument(path);
      const title = /<title[^>]*>([\s\S]*?)<\/title>/u.exec(html)?.[1]?.trim();

      expect(title, `${file}: resolved title is empty`).not.toBe('');
      expect(title, `${file}: repeats the root title instead of naming the page`).not.toBe(
        `UMAXICA (${TLD})`,
      );
      expect(title, `${file}: page title leaks a surface/runtime name`).not.toMatch(
        FORBIDDEN_TOKEN,
      );
    },
  );
});

describe('not-found document', () => {
  it('serves a complete, contract-conforming 404 document', async () => {
    const html = await renderDocument('/this-route-does-not-exist');

    expectTitleContract(html, { requirePageSpecific: true, label: 'not-found' });
    expect(html, 'must render a full document').toContain('<html');
    expect(html).toContain('HTTP 404');
    // A 404 is not a transient failure, so it offers no reload control.
    expect(html).not.toContain('再読み込み');
  });
});

describe('error document', () => {
  /*
   * Rendered directly rather than through the router: a memory-history router has
   * no way to induce a render failure, and the property under test is the title
   * this component emits. That it renders INSIDE the shell is proved by the
   * not-found case above, which goes through the router.
   */
  it('renders a non-empty conforming <title> in its final HTML', () => {
    const html = renderToStaticMarkup(<ErrorDocument error={new Error('boom')} reset={() => {}} />);

    expectTitleContract(html, { requirePageSpecific: true, label: 'error' });
    expect(html).toContain('HTTP 500');
    expect(html).toContain('再読み込み');
  });
});

describe('rate limited 429 document', () => {
  it('serves a full 429 document', async () => {
    const response = rateLimitedResponse();

    expect(response.status).toBe(429);
    expectTitleContract(await response.text(), { requirePageSpecific: true, label: '429' });
  });
});
