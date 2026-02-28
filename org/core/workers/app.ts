import { RouterContextProvider, createRequestHandler } from 'react-router';
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

export default {
  async fetch(request, env, ctx) {
    const nonce = generateNonce();

    const contextProvider = new RouterContextProvider();
    contextProvider.set(CloudflareContext, {
      cloudflare: { ctx, env },
      security: { nonce },
    });

    return requestHandler(request, contextProvider);
  },
} satisfies ExportedHandler<Env>;
