// @ts-ignore
import '../../test-setup.ts';

import { renderToStaticMarkup } from 'react-dom/server';
import { CloudflareContext } from '../../src/context';
import Authentication, { loader, meta } from '../../src/routes/authentication/_index';

function createMockContext(env: Record<string, unknown>) {
  const contextMap = new Map<unknown, unknown>([[CloudflareContext, { cloudflare: { env } }]]);

  return {
    get: (key: unknown) => contextMap.get(key),
  };
}

describe('Authentication route', () => {
  it('renders the authentication page', () => {
    const markup = renderToStaticMarkup(
      <Authentication loaderData={{ codeName: '', message: '' }} />,
    );

    expect(markup).toContain('認証');
    expect(markup).toContain('auth.umaxica.app');
  });

  it('returns authentication metadata', () => {
    expect(meta({} as never)).toContainEqual({ title: 'Umaxica - 認証' });
    expect(meta({} as never)).toContainEqual({ content: '認証ページ', name: 'description' });
  });

  it('returns an empty message when Cloudflare env is missing the value', () => {
    const result = loader({ context: createMockContext({}) } as never);
    expect(result).toStrictEqual({ message: '' });
  });

  it('returns the Cloudflare message when present', () => {
    const result = loader({
      context: createMockContext({ VALUE_FROM_CLOUDFLARE: 'auth-ready' }),
    } as never);
    expect(result).toStrictEqual({ message: 'auth-ready' });
  });
});
