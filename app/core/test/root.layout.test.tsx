import type * as ReactRouter from 'react-router';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type * as Root from '../src/root';

type RootModule = typeof Root;
type LoaderData = Awaited<ReturnType<RootModule['loader']>>;

let loaderDataOverride: LoaderData | undefined;

vi.mock(import('react-router'), async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    Links: (props: Record<string, unknown>) => createElement('vi-links', props),
    Meta: (props: Record<string, unknown>) => createElement('vi-meta', props),
    Scripts: (props: Record<string, unknown>) => createElement('vi-scripts', props),
    ScrollRestoration: (props: Record<string, unknown>) => createElement('vi-scroll', props),
    useLoaderData: () => {
      if (!loaderDataOverride) {
        throw new Error('loader data override not set');
      }
      return loaderDataOverride;
    },
  };
});

const actualRouter = await vi.importActual<typeof ReactRouter>('react-router');

const rootModule = await import('../src/root');
const { default: App, Layout, meta } = rootModule;

const baseLoaderData: LoaderData = {
  apexServiceUrl: '' as never,
  apiServiceUrl: '' as never,
  codeName: '' as never,
  cspNonce: '',
  docsServiceUrl: '' as never,
  edgeServiceUrl: '' as never,
  helpServiceUrl: '' as never,
  newsServiceUrl: '' as never,
  sentryDsn: '',
};

function renderLayoutWithData(data: Partial<LoaderData> = {}) {
  loaderDataOverride = { ...baseLoaderData, ...data };
  const markup = renderToStaticMarkup(
    <Layout>
      <div>child route</div>
    </Layout>,
  );
  loaderDataOverride = undefined;
  return markup;
}

afterAll(() => {
  loaderDataOverride = undefined;
  vi.restoreAllMocks();
});

describe('root layout shell', () => {
  it('provides an empty title by default', () => {
    expect(meta({} as never)).toStrictEqual([{ title: '' }]);
  });

  it('renders the html shell with child content', () => {
    const markup = renderLayoutWithData({ cspNonce: 'nonce-123' });

    expect(markup).toContain('<vi-links');
    expect(markup).toContain('<vi-meta');
    expect(markup).toContain('<vi-scroll nonce="nonce-123"');
    expect(markup).toContain('<vi-scripts nonce="nonce-123"');
    expect(markup).toContain('child route');
  });

  it('omits nonce attributes when loader data has no nonce', () => {
    const markup = renderLayoutWithData({ cspNonce: '' });

    expect(markup).not.toContain('nonce=""');
  });
});

describe('root route component', () => {
  it('renders an outlet placeholder for nested routes', () => {
    loaderDataOverride = baseLoaderData;
    const element = App();
    loaderDataOverride = undefined;

    expect(element.type).toBe(actualRouter.Outlet);
  });
});
