import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('react-i18next', () => ({
  initReactI18next: {},
  useTranslation: () => ({
    i18n: { language: 'ja', dir: () => 'ltr', changeLanguage: vi.fn() },
    t: (key: string) => key,
  }),
}));

vi.mock('../src/middleware/i18next', () => ({
  getLocale: () => 'ja',
  getInstance: () => undefined,
  i18nextMiddleware: (_args: unknown, next: () => unknown) => next(),
  localeCookie: { serialize: () => Promise.resolve('lng=ja') },
}));

const isRouteErrorResponseMock = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const actual = await (importOriginal as () => Promise<Record<string, unknown>>)();
  return {
    ...actual,
    Link: ({
      to,
      children,
      ...rest
    }: {
      to: string;
      children: React.ReactNode;
      [key: string]: unknown;
    }) => createElement('a', { href: to, ...rest }, children),
    Links: (props: Record<string, unknown>) => createElement('vi-links', props),
    Meta: (props: Record<string, unknown>) => createElement('vi-meta', props),
    Scripts: (props: Record<string, unknown>) => createElement('vi-scripts', props),
    ScrollRestoration: (props: Record<string, unknown>) => createElement('vi-scroll', props),
    isRouteErrorResponse: (error: unknown) => isRouteErrorResponseMock(error),
  };
});

const rootModule = await import('../src/root');
const { meta, ErrorBoundary } = rootModule;

describe('app root meta', () => {
  it('provides default empty meta title', () => {
    expect(meta({} as never)).toStrictEqual([{ title: '' }]);
  });
});

describe('app root ErrorBoundary', () => {
  beforeEach(() => {
    isRouteErrorResponseMock.mockReset();
  });

  it('renders NotFoundPage for 404 errors', () => {
    const error = {
      data: null,
      status: 404,
      statusText: 'Not Found',
    };
    isRouteErrorResponseMock.mockReturnValue(true);

    const markup = renderToStaticMarkup(<ErrorBoundary error={error} />);
    expect(markup).toContain('見つかりません');
    expect(markup).toContain('404');
  });

  it('renders InternalServerErrorPage for 500 errors', () => {
    const error = {
      data: null,
      status: 500,
      statusText: 'Internal Server Error',
    };
    isRouteErrorResponseMock.mockReturnValue(true);

    const markup = renderToStaticMarkup(<ErrorBoundary error={error} />);
    expect(markup).toContain('サーバーエラー');
    expect(markup).toContain('500');
  });

  it('renders ServiceUnavailablePage for 503 errors', () => {
    const error = {
      data: null,
      status: 503,
      statusText: 'Service Unavailable',
    };
    isRouteErrorResponseMock.mockReturnValue(true);

    const markup = renderToStaticMarkup(<ErrorBoundary error={error} />);
    expect(markup).toContain('メンテナンス中');
    expect(markup).toContain('503');
  });

  it('renders generic ErrorPage for other route errors', () => {
    const error = {
      data: null,
      status: 400,
      statusText: 'Bad Request',
    };
    isRouteErrorResponseMock.mockReturnValue(true);

    const markup = renderToStaticMarkup(<ErrorBoundary error={error} />);
    expect(markup).toContain('エラー');
    expect(markup).toContain('Bad Request');
  });

  it('renders InternalServerErrorPage for Error instances', () => {
    const error = new Error('Test error message');
    isRouteErrorResponseMock.mockReturnValue(false);

    const markup = renderToStaticMarkup(<ErrorBoundary error={error} />);
    expect(markup).toContain('エラー');
    expect(markup).toContain('500');
  });

  it('renders fallback ErrorPage for unknown errors', () => {
    isRouteErrorResponseMock.mockReturnValue(false);
    const markup = renderToStaticMarkup(<ErrorBoundary error="unknown error" />);
    expect(markup).toContain('予期しないエラー');
    expect(markup).toContain('500');
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});
