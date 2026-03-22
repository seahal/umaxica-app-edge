import { Hono } from 'hono';
import { timeout } from 'hono/timeout';
import type { Context } from 'hono';

export interface Meta {
  title?: string;
  pageTitle?: string;
  description?: string;
  canonical?: string;
  robots?: string;
}

export interface RootRedirectConfig {
  resolveRedirectUrl: (regionParam: string | null | undefined) => string | null;
  getDefaultRedirectUrl: () => string | null;
  buildRegionErrorPayload: () => { error: string; message: string };
}

export interface PageConfig {
  getRootMeta: (env: { BRAND_NAME?: string }) => Meta;
  renderRootContent: (language: string | undefined) => unknown;
}

export interface RootBindings {
  Bindings: {
    BRAND_NAME?: string;
  };
  Variables: {
    meta?: Meta;
    language?: string;
  };
}

export type RootContext = Context<RootBindings>;

function setMeta(c: RootContext, meta: Meta): void {
  c.set('meta', meta);
}

function createRedirectHandler(config: RootRedirectConfig) {
  return (c: RootContext) => {
    const regionParam = c.req.query('ri');
    const redirectUrl = config.resolveRedirectUrl(regionParam);
    if (redirectUrl) {
      return c.redirect(redirectUrl, 301);
    }
    const defaultRedirectUrl = config.getDefaultRedirectUrl();
    if (defaultRedirectUrl) {
      return c.redirect(defaultRedirectUrl, 301);
    }
    return c.json(config.buildRegionErrorPayload(), 400);
  };
}

function createPageHandler(config: PageConfig) {
  return (c: RootContext) => {
    setMeta(c, config.getRootMeta(c.env));
    return c.render(config.renderRootContent(c.get('language')) as string);
  };
}

export function createRootRoute(
  type: 'redirect',
  renderer: unknown,
  config: RootRedirectConfig,
): Hono<RootBindings>;
export function createRootRoute(
  type: 'page',
  renderer: unknown,
  config: PageConfig,
): Hono<RootBindings>;
// oxlint-disable-next-line no-unused-vars
export function createRootRoute(
  type: 'redirect' | 'page',
  renderer: unknown,
  config: RootRedirectConfig | PageConfig,
): Hono<RootBindings> {
  const route = new Hono<RootBindings>();

  if (type === 'redirect') {
    route.get('/', createRedirectHandler(config as RootRedirectConfig));
  } else {
    // oxlint-disable-next-line no-explicit-any
    route.use(renderer as any);
    route.get('/', timeout(2000), createPageHandler(config as PageConfig));
  }

  return route;
}
