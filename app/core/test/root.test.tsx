import { createElement } from 'react';
import { render, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CloudflareContext } from '../src/context';
import type { LoaderData } from '../src/root';

const changeLanguageMock = vi.fn();
let mockLanguage = 'ja';

vi.mock('react-i18next', () => ({
  initReactI18next: {},
  useTranslation: () => ({
    i18n: { language: mockLanguage, dir: () => 'ltr', changeLanguage: changeLanguageMock },
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
    Outlet: () => createElement('vi-outlet'),
    isRouteErrorResponse: (error: unknown) => isRouteErrorResponseMock(error),
  };
});

const rootModule = await import('../src/root');
const { default: App, meta, ErrorBoundary, middleware } = rootModule;

const baseLoaderData: LoaderData = {
  apexServiceUrl: '',
  apiServiceUrl: '',
  codeName: '',
  cspNonce: '',
  docsServiceUrl: '',
  edgeServiceUrl: '',
  helpServiceUrl: '',
  locale: 'ja',
  newsServiceUrl: '',
};

describe('app root meta', () => {
  it('provides default empty meta title', () => {
    expect(meta({} as never)).toStrictEqual([{ title: '' }]);
  });
});

describe('app root ErrorBoundary', () => {
  beforeEach(() => {
    changeLanguageMock.mockReset();
    isRouteErrorResponseMock.mockReset();
    mockLanguage = 'ja';
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

describe('app root route component', () => {
  beforeEach(() => {
    changeLanguageMock.mockReset();
    mockLanguage = 'ja';
  });

  it('changes the i18n language when loader locale differs', async () => {
    mockLanguage = 'ja';

    render(<App loaderData={{ ...baseLoaderData, locale: 'en' }} />);

    await waitFor(() => {
      expect(changeLanguageMock).toHaveBeenCalledWith('en');
    });
  });

  it('does not change the i18n language when loader locale matches', async () => {
    mockLanguage = 'ja';

    render(<App loaderData={baseLoaderData} />);

    await waitFor(() => {
      expect(changeLanguageMock).not.toHaveBeenCalled();
    });
  });
});

describe('app root middleware', () => {
  const securityMiddleware = middleware[0];

  it('adds a CSP nonce when one is missing', () => {
    if (!securityMiddleware) {
      throw new Error('security middleware not found');
    }

    const existingContext = {
      cloudflare: {
        env: {
          BRAND_NAME: 'Umaxica',
        },
      },
    };
    const set = vi.fn();
    const next = vi.fn(() => new Response(null, { status: 204 }));
    const context = {
      get: () => existingContext,
      set,
    };

    const response = securityMiddleware(
      {
        context,
        request: new Request('https://example.com'),
      } as never,
      next,
    );

    expect(set).toHaveBeenCalledWith(
      CloudflareContext,
      expect.objectContaining({
        cloudflare: existingContext.cloudflare,
        security: {
          nonce: expect.any(String),
        },
      }),
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(Response);
  });

  it('creates security context when Cloudflare context is absent', () => {
    if (!securityMiddleware) {
      throw new Error('security middleware not found');
    }

    const set = vi.fn();
    const next = vi.fn(() => new Response(null, { status: 204 }));
    const context = {
      get: () => undefined,
      set,
    };

    void securityMiddleware(
      {
        context,
        request: new Request('https://example.com'),
      } as never,
      next,
    );

    expect(set).toHaveBeenCalledWith(
      CloudflareContext,
      expect.objectContaining({
        security: {
          nonce: expect.any(String),
        },
      }),
    );
  });

  it('reuses the existing CSP nonce when one is already present', () => {
    if (!securityMiddleware) {
      throw new Error('security middleware not found');
    }

    const set = vi.fn();
    const next = vi.fn(() => new Response(null, { status: 204 }));
    const context = {
      get: () => ({
        security: {
          nonce: 'existing-nonce',
        },
      }),
      set,
    };

    const response = securityMiddleware(
      {
        context,
        request: new Request('https://example.com'),
      } as never,
      next,
    );

    expect(set).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(response).toBeInstanceOf(Response);
  });
});

describe('app root ErrorBoundary fallback details', () => {
  beforeEach(() => {
    isRouteErrorResponseMock.mockReset();
  });

  it('uses a default message for 5xx route errors without status text', () => {
    isRouteErrorResponseMock.mockReturnValue(true);

    const markup = renderToStaticMarkup(
      <ErrorBoundary
        error={{
          data: null,
          status: 502,
        }}
      />,
    );

    expect(markup).toContain('サーバーエラー');
    expect(markup).toContain('500');
  });

  it('uses a default message for non-5xx route errors without status text', () => {
    isRouteErrorResponseMock.mockReturnValue(true);

    const markup = renderToStaticMarkup(
      <ErrorBoundary
        error={{
          data: null,
          status: 418,
        }}
      />,
    );

    expect(markup).toContain('418 エラー');
    expect(markup).toContain('リクエストの処理中にエラーが発生しました。');
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});
