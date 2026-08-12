import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const sentry = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
  init: vi.fn(),
  replayIntegration: vi.fn(() => 'replay'),
}));

vi.mock('@sentry/nextjs', () => sentry);

import GlobalError from '../src/app/global-error';
import RootLayout, { metadata } from '../src/app/layout';
import manifest from '../src/app/manifest';
import { ServiceWorkerRegistration } from '../src/components/service-worker-registration';

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('dev/acme application shell', () => {
  it('reports a rendering error and lets the user retry', async () => {
    const error = new Error('render failed');
    const reset = vi.fn();
    render(<GlobalError error={error} reset={reset} />, { container: document });

    await waitFor(() => expect(sentry.captureException).toHaveBeenCalledWith(error));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it('renders the root document and publishes install metadata', () => {
    expect(renderToStaticMarkup(<RootLayout>content</RootLayout>)).toContain('content');
    expect(metadata).toMatchObject({
      title: { default: 'UMAXICA (DEV)', template: '%s — UMAXICA (DEV)' },
    });
    expect(manifest()).toMatchObject({ start_url: '/', display: 'standalone' });
  });
});

describe('dev/acme service worker registration', () => {
  it('registers the worker without HTTP cache reuse', async () => {
    const register = vi.fn(() => Promise.resolve({}));
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });

    render(<ServiceWorkerRegistration />);
    await waitFor(() =>
      expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/', updateViaCache: 'none' }),
    );
  });

  it('does nothing in browsers without service-worker support', () => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
    expect(() => render(<ServiceWorkerRegistration />)).not.toThrow();
  });

  it('contains registration failures because startup must remain usable', async () => {
    const register = vi.fn(() => Promise.reject(new Error('registration failed')));
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });
    render(<ServiceWorkerRegistration />);
    await waitFor(() => expect(register).toHaveBeenCalledOnce());
  });
});

describe('dev/acme client instrumentation', () => {
  it('initializes Sentry when a public DSN is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://public.example.test/1');
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    const instrumentation = await import('../src/instrumentation-client');

    expect(sentry.replayIntegration).toHaveBeenCalledOnce();
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ tracesSampleRate: 0.1, sendDefaultPii: false }),
    );
    expect(instrumentation.onRouterTransitionStart).toBe(sentry.captureRouterTransitionStart);
  });

  it('does not initialize Sentry without a DSN', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', '');
    vi.resetModules();
    await import('../src/instrumentation-client');
    expect(sentry.init).not.toHaveBeenCalled();
  });

  it('uses full client tracing outside production', async () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://public.example.test/1');
    vi.stubEnv('NODE_ENV', 'test');
    vi.resetModules();
    await import('../src/instrumentation-client');
    expect(sentry.init).toHaveBeenCalledWith(expect.objectContaining({ tracesSampleRate: 1 }));
  });
});

describe.each([
  ['server', () => import('../sentry.server.config')],
  ['edge', () => import('../sentry.edge.config')],
] as const)('dev/acme %s Sentry config', (_runtime, loadConfig) => {
  it('uses conservative production tracing when a DSN is configured', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://public.example.test/1');
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    await loadConfig();
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({ tracesSampleRate: 0.1, sendDefaultPii: false }),
    );
  });

  it('uses full tracing outside production', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://public.example.test/1');
    vi.stubEnv('NODE_ENV', 'test');
    vi.resetModules();
    await loadConfig();
    expect(sentry.init).toHaveBeenCalledWith(expect.objectContaining({ tracesSampleRate: 1 }));
  });

  it('does not initialize without a DSN', async () => {
    vi.stubEnv('SENTRY_DSN', '');
    vi.resetModules();
    await loadConfig();
    expect(sentry.init).not.toHaveBeenCalled();
  });
});
