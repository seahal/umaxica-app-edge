import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

let routeLoaderDataOverride:
  | { codeName?: string; helpServiceUrl?: string; docsServiceUrl?: string; newsServiceUrl?: string }
  | undefined;

vi.mock(import('react-router'), async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    Outlet: () => createElement('vi-outlet'),
    useRouteLoaderData: () => routeLoaderDataOverride,
  };
});

vi.mock(import('../../src/components/Header'), () => ({
  Header: (props: Record<string, unknown>) => createElement('vi-header', props),
}));

vi.mock(import('../../src/components/Footer'), () => ({
  Footer: (props: Record<string, unknown>) => createElement('vi-footer', props),
}));

const { default: DecoratedLayout } = await import('../../src/layouts/decorated');

describe('app_www DecoratedLayout', () => {
  it('renders layout with all components when data is available', () => {
    routeLoaderDataOverride = {
      codeName: 'TestApp',
      docsServiceUrl: 'https://docs.app.com',
      helpServiceUrl: 'https://help.app.com',
      newsServiceUrl: 'https://news.app.com',
    };

    const markup = renderToStaticMarkup(<DecoratedLayout />);

    expect(markup).toContain('<vi-header');
    expect(markup).toContain('<vi-outlet');
    expect(markup).toContain('<vi-footer');
    expect(markup).toContain('<vi-header');
  });

  it('uses empty strings when loader data is undefined', () => {
    routeLoaderDataOverride = undefined;

    const markup = renderToStaticMarkup(<DecoratedLayout />);

    expect(markup).toContain('<vi-header');
    expect(markup).toContain('<vi-outlet');
    expect(markup).toContain('<vi-footer');
  });

  it('uses empty strings when loader data properties are missing', () => {
    routeLoaderDataOverride = {};

    const markup = renderToStaticMarkup(<DecoratedLayout />);

    expect(markup).toContain('<vi-header');
    expect(markup).toContain('<vi-outlet');
    expect(markup).toContain('<vi-footer');
  });
});

afterAll(() => {
  routeLoaderDataOverride = undefined;
  vi.restoreAllMocks();
});
