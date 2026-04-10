import { Hono } from 'hono';
import { timeout } from 'hono/timeout';
import type { Context, ErrorHandler } from 'hono';

export interface Meta {
  title?: string;
  pageTitle?: string;
  description?: string;
  canonical?: string;
  robots?: string;
  og?: {
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    image?: string;
  };
  twitter?: {
    card?: string;
    site?: string;
  };
}

export interface AboutBindings {
  Bindings: {
    BRAND_NAME?: string;
  };
  Variables: {
    meta?: Meta;
    language?: string;
  };
}

export type AboutContext = Context<AboutBindings>;

export interface AboutConfig {
  getAboutMeta: (env: { BRAND_NAME?: string }) => Meta;
  renderAboutContent: (language: string | undefined) => unknown;
}

function setMeta(c: AboutContext, meta: Meta): void {
  c.set('meta', meta);
}

export function createAboutRoute(renderer: unknown, config: AboutConfig): Hono<AboutBindings> {
  const route = new Hono<AboutBindings>();

  // oxlint-disable-next-line no-explicit-any
  route.use(renderer as any);

  route.get('/about', timeout(2000), (c: AboutContext) => {
    setMeta(c, config.getAboutMeta(c.env));
    return c.render(config.renderAboutContent(c.get('language')) as string);
  });

  // Propagate errors to parent app so onError handlers work correctly
  const errorHandler: ErrorHandler<AboutBindings> = (err) => {
    throw err;
  };
  route.onError(errorHandler);

  return route;
}
