export type FetcherBinding = {
  fetch(request: Request): Promise<Response>;
};

export type ManifestRoute =
  | {
      type: 'literal';
      path: string;
    }
  | {
      type: 'regex';
      re: string;
    };

export type SpaManifest = {
  version: 1;
  routes: ManifestRoute[];
};

type CompiledRoutes = {
  literals: Set<string>;
  regexes: RegExp[];
};

type AssetEnv = {
  ASSETS: FetcherBinding;
};

type FallbackOptions<TEnv extends AssetEnv> = {
  request: Request;
  env: TEnv;
  onSpaRouteMatched?: () => Promise<Response>;
};

let cachedCompiledRoutes: CompiledRoutes | null = null;
let pendingCompiledRoutes: Promise<CompiledRoutes> | null = null;

function compileManifest(manifest: SpaManifest): CompiledRoutes {
  const literals = new Set<string>();
  const regexes: RegExp[] = [];

  for (const route of manifest.routes) {
    if (route.type === 'literal') {
      literals.add(route.path);
      continue;
    }

    try {
      regexes.push(new RegExp(route.re));
    } catch {
      // Ignore invalid entries and continue.
    }
  }

  return { literals, regexes };
}

async function loadCompiledRoutes<TEnv extends AssetEnv>(
  request: Request,
  env: TEnv,
): Promise<CompiledRoutes> {
  if (cachedCompiledRoutes) {
    return cachedCompiledRoutes;
  }

  if (!pendingCompiledRoutes) {
    pendingCompiledRoutes = (async () => {
      const manifestUrl = new URL('/spa-routes.json', request.url);
      const manifestReq = new Request(manifestUrl.toString(), {
        method: 'GET',
        headers: request.headers,
      });

      const response = await env.ASSETS.fetch(manifestReq);
      if (response.status !== 200) {
        return { literals: new Set<string>(), regexes: [] };
      }

      let manifest: SpaManifest;
      try {
        manifest = (await response.json()) as SpaManifest;
      } catch {
        return { literals: new Set<string>(), regexes: [] };
      }

      if (manifest.version !== 1 || !Array.isArray(manifest.routes)) {
        return { literals: new Set<string>(), regexes: [] };
      }

      return compileManifest(manifest);
    })();
  }

  cachedCompiledRoutes = await pendingCompiledRoutes;
  return cachedCompiledRoutes;
}

function isNavigationRequest(request: Request): boolean {
  if (request.method !== 'GET') {
    return false;
  }

  const accept = request.headers.get('accept');
  if (!accept) {
    return false;
  }

  return accept.includes('text/html');
}

function matchesSpaRoute(pathname: string, compiledRoutes: CompiledRoutes): boolean {
  if (compiledRoutes.literals.has(pathname)) {
    return true;
  }

  return compiledRoutes.regexes.some((regex) => regex.test(pathname));
}

function buildAssetRequest(pathname: string, request: Request): Request {
  const url = new URL(pathname, request.url);
  return new Request(url.toString(), {
    method: 'GET',
    headers: request.headers,
  });
}

async function serveAssetOr404<TEnv extends AssetEnv>(
  pathname: string,
  request: Request,
  env: TEnv,
  statusOverride?: number,
): Promise<Response> {
  const response = await env.ASSETS.fetch(buildAssetRequest(pathname, request));

  if (!statusOverride) {
    return response;
  }

  const headers = new Headers(response.headers);
  if (!headers.has('content-type')) {
    headers.set('content-type', 'text/html; charset=utf-8');
  }

  return new Response(response.body, {
    status: statusOverride,
    headers,
  });
}

export async function handleAssetsAndSpaFallback<TEnv extends AssetEnv>(
  options: FallbackOptions<TEnv>,
): Promise<Response> {
  const { request, env, onSpaRouteMatched } = options;

  const directAssetResponse = await env.ASSETS.fetch(request);
  if (directAssetResponse.status !== 404) {
    return directAssetResponse;
  }

  const url = new URL(request.url);
  if (isNavigationRequest(request)) {
    const compiledRoutes = await loadCompiledRoutes(request, env);
    if (matchesSpaRoute(url.pathname, compiledRoutes)) {
      if (onSpaRouteMatched) {
        return onSpaRouteMatched();
      }

      const indexResponse = await serveAssetOr404('/index.html', request, env);
      if (indexResponse.status !== 404) {
        return indexResponse;
      }
    }
  }

  const customNotFoundResponse = await serveAssetOr404('/404.html', request, env, 404);
  if (customNotFoundResponse.status === 404) {
    return customNotFoundResponse;
  }

  return new Response('Not Found', { status: 404 });
}
