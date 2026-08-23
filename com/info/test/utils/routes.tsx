import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import type { ComponentType } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { getRouter } from '../../src/router';
import { Route as rootRoute } from '../../src/routes/__root';
import { Route as aboutRoute } from '../../src/routes/about';
import { Route as healthRoute } from '../../src/routes/health';
import { Route as healthJsonRoute } from '../../src/routes/health[.]json';
import { Route as indexRoute } from '../../src/routes/index';
import { Route as manifestRoute } from '../../src/routes/manifest[.]webmanifest';
import { Route as offlineRoute } from '../../src/routes/offline';
import { Route as revisionRoute } from '../../src/routes/revision';
import { Route as robotsRoute } from '../../src/routes/robots[.]txt';
import { Route as sitemapRoute } from '../../src/routes/sitemap[.]xml';

/*
 * The seam between this unit's tests and TanStack's route objects.
 *
 * A route is a value rather than a default export, so a test reaches its
 * component through `Route.options.component` and its server handler through
 * `Route.options.server.handlers.GET`. Naming that once here keeps the internal
 * shape out of thirteen test files, and keeps the tests asserting the CONTRACT
 * — the markup, the status, the headers — rather than the framework's object
 * layout.
 *
 * Nothing here renders through the real router. These are plain components and
 * plain handlers, which is what the shell, title and status-surface contracts
 * are actually about; the router's own behaviour is covered by the Hurl suites
 * against a real server.
 */

type Handler = () => Response | Promise<Response>;

function handlerOf(route: { options: unknown }): Handler {
  const { options } = route as { options: { server?: { handlers?: { GET?: Handler } } } };
  const get = options.server?.handlers?.GET;
  if (!get) throw new Error('route declares no GET handler');
  return get;
}

function componentOf(route: { options: unknown }): ComponentType {
  const { options } = route as { options: { component?: ComponentType } };
  if (!options.component) throw new Error('route declares no component');
  return options.component;
}

export const handlers = {
  health: handlerOf(healthRoute),
  healthJson: handlerOf(healthJsonRoute),
  revision: handlerOf(revisionRoute),
  robots: handlerOf(robotsRoute),
  sitemap: handlerOf(sitemapRoute),
  manifest: handlerOf(manifestRoute),
};

export const components = {
  index: componentOf(indexRoute),
  about: componentOf(aboutRoute),
  offline: componentOf(offlineRoute),
};

/**
 * The whole document this unit serves for `path`, rendered through a real
 * router.
 *
 * A bare `renderToStaticMarkup(<Shell>…</Shell>)` cannot work: `<HeadContent />`
 * reads router state, so without a provider it throws. Driving a memory-history
 * router instead is also the more faithful test — what comes back is the
 * document a browser would receive, `<head>` included, which is what the shell,
 * title and status contracts are actually about.
 */
export async function renderDocument(path: string): Promise<string> {
  const router = getRouter();
  router.update({ history: createMemoryHistory({ initialEntries: [path] }) });
  await router.load();
  return renderToStaticMarkup(<RouterProvider router={router} />);
}

/*
 * There is deliberately no "render the shell alone" helper. `<HeadContent />`
 * reads router state, so a bare `renderToStaticMarkup(<Shell>…</Shell>)` throws
 * — measured. Everything that is about a document goes through
 * `renderDocument()`; the two failure components are exercised directly, and the
 * fact that they render inside the shell is proved by `renderDocument()` on an
 * unmatched path.
 */

/** The `<title>` a route declares through its `head()`, or `undefined`. */
export function headTitleOf(route: { options: unknown }): string | undefined {
  const { options } = route as {
    options: { head?: () => { meta?: readonly { title?: string }[] } };
  };
  const meta = options.head?.().meta ?? [];
  return meta.find((entry) => typeof entry.title === 'string')?.title;
}

export {
  aboutRoute,
  healthJsonRoute,
  healthRoute,
  indexRoute,
  manifestRoute,
  offlineRoute,
  revisionRoute,
  robotsRoute,
  rootRoute,
  sitemapRoute,
};
