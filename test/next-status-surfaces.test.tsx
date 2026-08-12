import { act } from '../app/core/node_modules/react';
// @ts-expect-error React is provided by the app workspace, not the root package.
import { createElement } from '../app/core/node_modules/react';
import { createRoot } from '../app/core/node_modules/react-dom/client';
import { renderToStaticMarkup } from '../app/core/node_modules/react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setCloudflareContext, setCloudflareContextShouldThrow } from '@opennextjs/cloudflare';
import { createApexApp as createAppApex } from '../app/apex/src/create-apex-app';
import { createApexApp as createComApex } from '../com/apex/src/create-apex-app';
import { createApexApp as createNetApex } from '../net/apex/src/create-apex-app';
import { createApexApp as createOrgApex } from '../org/apex/src/create-apex-app';
import { app as devApex } from '../dev/apex/src/app';

const nextApps = [
  'app/core',
  'app/docs',
  'app/help',
  'app/info',
  'app/news',
  'com/core',
  'com/docs',
  'com/help',
  'com/info',
  'com/news',
  'org/core',
  'org/docs',
  'org/help',
  'org/info',
  'org/news',
] as const;

const satelliteApps = nextApps.filter((workspace) => !workspace.endsWith('/core'));

const apexFactories = [
  ['app', createAppApex],
  ['com', createComApex],
  ['net', createNetApex],
  ['org', createOrgApex],
] as const;

function mount(element: ReturnType<typeof createElement>) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => {
    root.render(element);
  });
  return {
    host,
    unmount() {
      act(() => {
        root.unmount();
      });
      host.remove();
    },
  };
}

function clickButton(host: HTMLElement, label: string) {
  const button = Array.from(host.querySelectorAll('button')).find(
    (node) => node.textContent?.trim() === label,
  );
  expect(button).toBeTruthy();
  act(() => {
    button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  setCloudflareContext({ env: {} });
  setCloudflareContextShouldThrow(false);
  delete (navigator as unknown as { serviceWorker?: ServiceWorkerContainer }).serviceWorker;
  document.body.innerHTML = '';
});

describe.each(nextApps)('%s status surfaces', (workspace) => {
  it('renders error, offline, and not-found recovery UI', async () => {
    const [{ default: ErrorPage }, { default: OfflinePage }, { default: GlobalNotFound }] =
      await Promise.all([
        import(`../${workspace}/src/app/error`),
        import(`../${workspace}/src/app/offline/page`),
        import(`../${workspace}/src/app/global-not-found`),
      ]);

    const reset = vi.fn();
    const view = mount(createElement(ErrorPage, { error: new Error('boom'), reset }));
    clickButton(view.host, '再読み込み');
    expect(reset).toHaveBeenCalledOnce();
    view.unmount();

    expect(renderToStaticMarkup(createElement(OfflinePage))).toContain('オフライン');
    expect(renderToStaticMarkup(createElement(GlobalNotFound))).toContain('HTTP 404');
  });

  it('renders global-error recovery UI', async () => {
    const { default: GlobalError } = await import(`../${workspace}/src/app/global-error`);
    const reset = vi.fn();
    const view = mount(createElement(GlobalError, { error: new Error('boom'), reset }));
    clickButton(view.host, '再読み込み');
    expect(reset).toHaveBeenCalledOnce();
    view.unmount();
  });

  it('returns revision metadata and falls back when context is unavailable', async () => {
    const { GET } = await import(`../${workspace}/src/app/revision/route`);

    setCloudflareContext({
      env: { REVISION: { id: 'id-1', tag: 'tag-1', timestamp: 'ts-1' } },
    });
    const withMeta = GET();
    expect(withMeta.status).toBe(200);
    expect(withMeta.headers.get('Cache-Control')).toBe('no-store');
    expect(withMeta.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
    await expect(withMeta.json()).resolves.toEqual({
      id: 'id-1',
      tag: 'tag-1',
      timestamp: 'ts-1',
    });

    setCloudflareContext({ env: {} });
    await expect(GET().json()).resolves.toEqual({
      id: null,
      tag: null,
      timestamp: null,
    });

    setCloudflareContextShouldThrow(true);
    await expect(GET().json()).resolves.toEqual({
      id: null,
      tag: null,
      timestamp: null,
    });
  });
});

describe.each(satelliteApps)('%s service worker registration', (workspace) => {
  it('registers when supported and ignores failures', async () => {
    const { ServiceWorkerRegistration } = await import(
      `../${workspace}/src/components/service-worker-registration`
    );

    const register = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });
    const ok = mount(createElement(ServiceWorkerRegistration));
    await vi.waitFor(() =>
      expect(register).toHaveBeenCalledWith('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none',
      }),
    );
    ok.unmount();

    delete (navigator as unknown as { serviceWorker?: ServiceWorkerContainer }).serviceWorker;
    const missing = mount(createElement(ServiceWorkerRegistration));
    missing.unmount();

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register: vi.fn().mockRejectedValue(new Error('unsupported')) },
    });
    const rejected = mount(createElement(ServiceWorkerRegistration));
    rejected.unmount();
  });
});

describe.each(apexFactories)('%s apex offline and not-found', (service, createApexApp) => {
  it('serves offline HTML and a 404 status page', async () => {
    const app = createApexApp(() => undefined, { service });

    const offline = await app.request('/offline');
    expect(offline.status).toBe(200);
    await expect(offline.text()).resolves.toContain('オフラインです');

    const missing = await app.request('/definitely-missing');
    expect(missing.status).toBe(404);
    await expect(missing.text()).resolves.toContain('HTTP 404');
  });

  it('uses the 5xx reload affordance on unexpected errors', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = createApexApp(
      (routes) => {
        routes.get('/boom', () => {
          throw new Error('hidden');
        });
      },
      { service },
    );
    const response = await app.request('/boom');
    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toContain('再読み込み');
    expect(consoleError).toHaveBeenCalled();
  });
});

describe('dev/acme status surfaces', () => {
  it('renders global-error and registers the service worker', async () => {
    const { default: GlobalError } = await import('../dev/acme/src/app/global-error');
    const { ServiceWorkerRegistration } =
      await import('../dev/acme/src/components/service-worker-registration');

    const reset = vi.fn();
    const view = mount(createElement(GlobalError, { error: new Error('boom'), reset }));
    clickButton(view.host, 'Try again');
    expect(reset).toHaveBeenCalledOnce();
    view.unmount();

    const register = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });
    const ok = mount(createElement(ServiceWorkerRegistration));
    await vi.waitFor(() =>
      expect(register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      }),
    );
    ok.unmount();

    delete (navigator as unknown as { serviceWorker?: ServiceWorkerContainer }).serviceWorker;
    const missing = mount(createElement(ServiceWorkerRegistration));
    missing.unmount();
  });
});

describe('dev apex title branch', () => {
  it('covers the page-name title branch via about content', async () => {
    const response = await devApex.request('/about');
    const html = await response.text();
    expect(html).toContain('About | UMAXICA (dev) - Apex');
  });
});
