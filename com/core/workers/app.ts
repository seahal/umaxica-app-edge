import { RouterContextProvider, createRequestHandler } from 'react-router';
import { handleAssetsAndSpaFallback } from '../../../shared/edge-static/spa-fallback';
import { CloudflareContext } from '../src/context';

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCodePoint(...array));
}

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
  () => new RouterContextProvider(),
);

function createContextProvider(env: Env, ctx: ExecutionContext): RouterContextProvider {
  const nonce = generateNonce();
  const contextProvider = new RouterContextProvider();
  contextProvider.set(CloudflareContext, {
    cloudflare: { ctx, env },
    security: { nonce },
  });
  return contextProvider;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return requestHandler(request, createContextProvider(env, ctx));
    }

    return handleAssetsAndSpaFallback({
      request,
      env,
      onSpaRouteMatched: () => requestHandler(request, createContextProvider(env, ctx)),
    });
  },
} satisfies ExportedHandler<Env>;
