import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { components, headTitleOf, indexRoute, renderDocument, rootRoute } from './utils/routes';

describe('com/info application shell', () => {
  it('renders the public page inside the shell', async () => {
    const html = await renderDocument('/');

    expect(html).toContain('UMAXICA インフォメーション');
    // One of each landmark, in document order — the shell supplies header and
    // footer, the page supplies the single <main>.
    expect(html.match(/<(header|main|footer)\b/gu)).toEqual(['<header', '<main', '<footer']);
  });

  it("renders the page on its own too, so the copy is the page's and not the shell's", () => {
    const Home = components.index;

    expect(renderToStaticMarkup(<Home />)).toContain('サービスに関するご案内');
  });

  /*
   * Next expressed this as `metadata.title.default` on the root layout, with a
   * `template` closing every page title with the brand. TanStack has neither, so
   * the index route owns the document default outright and `brandTitle()` is what
   * keeps the suffix identical across routes — see `src/lib/title.ts`.
   */
  it('gives the index route the document default title', () => {
    expect(headTitleOf(indexRoute)).toBe('Info — UMAXICA (COM)');
  });

  // The root must contribute no title at all, or a not-found document rendering
  // its own would produce two `<title>` elements and break
  // `api/title-contract.hurl`'s `count(//title) == 1`.
  it('contributes no title from the root route', () => {
    expect(headTitleOf(rootRoute)).toBeUndefined();
  });
});
