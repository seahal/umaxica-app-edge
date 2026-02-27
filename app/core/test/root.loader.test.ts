import { CloudflareContext } from '../src/context';
import { loader } from '../src/root';

interface LoaderContext {
  cloudflare?: { env?: Record<string, string> };
  security?: { nonce?: string };
}

function createMockContext(data: LoaderContext) {
  const contextMap = new Map<symbol, unknown>([[CloudflareContext, data]]);

  return {
    get: (key: symbol) => contextMap.get(key),
  };
}

function runLoader(context: LoaderContext) {
  const mockContext = createMockContext(context);
  return loader({ context: mockContext } as unknown as Parameters<typeof loader>[0]);
}

describe('root loader', () => {
  it('maps Cloudflare env values into loader data', async () => {
    const result = await runLoader({
      cloudflare: {
        env: {
          APEX_SERVICE_URL: 'umaxica.app',
          API_SERVICE_URL: 'api.umaxica.app',
          BRAND_NAME: 'Project Nova',
          DOCS_SERVICE_URL: 'docs.umaxica.app',
          EDGE_SERVICE_URL: 'edge.umaxica.app',
          HELP_SERVICE_URL: 'support.umaxica.app',
          NEWS_SERVICE_URL: 'news.umaxica.app',
        },
      },
      security: { nonce: 'csp-nonce' },
    });
    expect(result).toMatchObject({
      apexServiceUrl: 'umaxica.app',
      apiServiceUrl: 'api.umaxica.app',
      codeName: 'Project Nova',
      cspNonce: 'csp-nonce',
      docsServiceUrl: 'docs.umaxica.app',
      edgeServiceUrl: 'edge.umaxica.app',
      helpServiceUrl: 'support.umaxica.app',
      newsServiceUrl: 'news.umaxica.app',
    });
  });
});
