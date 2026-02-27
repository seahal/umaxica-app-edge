/* eslint-disable import/no-relative-parent-imports, func-style */
import { renderToStaticMarkup } from 'react-dom/server';

const routeModule = await import('../../src/routes/healths/_index');
const { loader, meta, default: HealthRoute } = routeModule;

const runLoader = (env: Record<string, unknown>): unknown =>
  loader({
    context: { cloudflare: { env } },
  } as never);

describe('Route: /health (org)', () => {
  it('declares description metadata', () => {
    expect(meta({} as never)).toStrictEqual([{ content: 'status page', name: 'description' }]);
  });

  it('returns Cloudflare derived message values', () => {
    const result = runLoader({ VALUE_FROM_CLOUDFLARE: 'healthy' });
    expect(result).toStrictEqual({ message: 'healthy' });
  });

  it('renders the health status content', () => {
    const markup = renderToStaticMarkup(<HealthRoute loaderData={{ message: 'healthy' }} />);

    expect(markup).toContain('<h2>ok</h2>');
  });
});
