/** @jsxImportSource hono/jsx */
import { Hono } from 'hono';

import type { ApexEnv } from '../src/create-apex-app';
import { renderer } from '../src/renderer';

/*
 * What the renderer emits — the document structure, the header, `<main>`, the
 * footer identity, `lang="ja"`, the viewport meta and the compiled-stylesheet
 * link — is asserted against real responses in `api/ui-shell-contract.hurl`
 * and `api/routes.hurl`. Those cases were driving a throwaway `new Hono()`
 * here, which is what made them weak: they proved the renderer renders, not
 * that the app mounts it.
 *
 * One case cannot move. `BRAND_NAME` is a Workers binding, so no HTTP client
 * can vary it, and the root title it produces (`UMAXICA (DEV)` with no page
 * segment) belongs to no route — every real route sets a page name. Here
 * `app.request()` is the driver and the binding is the subject.
 */
describe('Renderer layout', () => {
  it('builds the root title from the BRAND_NAME binding', async () => {
    const app = new Hono<ApexEnv>();
    app.use(renderer);
    app.get('/', (c) => c.render(<p>Test content</p>));

    const res = await app.request('/', {}, { BRAND_NAME: 'UMAXICA' });
    const body = await res.text();

    expect(body).toContain('UMAXICA');
    expect(body).toContain('<title>UMAXICA (DEV)</title>');
  });
});
