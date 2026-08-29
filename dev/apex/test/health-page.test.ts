import { renderHealthJson, renderHealthPage } from '../src/health-page';

describe('renderHealthPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the fallback health response when the primary response cannot be built', async () => {
    const NativeResponse = Response;
    let responseCalls = 0;

    class ThrowOnceResponse extends NativeResponse {
      constructor(body?: BodyInit | null, init?: ResponseInit) {
        responseCalls += 1;

        if (responseCalls === 1) {
          throw new Error('primary response failed');
        }

        super(body, init);
      }
    }

    vi.stubGlobal('Response', ThrowOnceResponse);

    const response = renderHealthPage({ BRAND_NAME: 'UMAXICA' }, { service: 'app' }, undefined);

    expect(response.status).toBe(503);
    expect(response.headers.get('content-type')).toBe('text/html; charset=UTF-8');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(await response.text()).toContain('status: error');
  });

  it('uses Cloudflare version metadata in the health JSON response', async () => {
    const response = renderHealthJson(
      { CF_VERSION_METADATA: { id: 'test-version-id' } },
      { service: 'app' },
    );

    expect(await response.json()).toEqual({
      status: 'OK',
      service: 'app',
      version: 'test-version-id',
      environment: null,
      edge: 'cloudflare',
      time: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u),
    });
  });

  it('reports the wrangler environment when EDGE_ENV is bound', async () => {
    const response = renderHealthJson({ EDGE_ENV: 'test' }, { service: 'dev' });

    expect(await response.json()).toMatchObject({ environment: 'test' });
  });

  it('renders the environment in the health page', async () => {
    const response = renderHealthPage({ EDGE_ENV: 'production' }, { service: 'dev' }, undefined);

    /*
     * Matched as a `<dt>`/`<dd>` pair with the attributes left open, rather than
     * as the literal `<dd>production</dd>` this replaces. The value's typography
     * is a styling decision — it is set in the monospace family, like every
     * other identifier this unit renders — and a test that pins the tag exactly
     * fails on a font change while still passing if the row lost its label.
     */
    expect(await response.text()).toMatch(
      /<dt[^>]*>environment<\/dt>\s*<dd[^>]*>production<\/dd>/u,
    );
  });
});
