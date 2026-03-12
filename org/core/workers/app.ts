import { RouterContextProvider, createRequestHandler } from 'react-router';
import { checkRateLimit } from '../../../shared/apex/rate-limit';
import { CloudflareContext } from '../src/context';

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCodePoint(...array));
}

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  (import.meta as unknown as { env: { MODE: string } }).env.MODE,
  () => new RouterContextProvider(),
);

export default {
  async fetch(request, env, ctx) {
    const rateLimitResponse = await checkRateLimit(request, env.RATE_LIMITER);
    if (rateLimitResponse) return rateLimitResponse;

    const nonce = generateNonce();

    const contextProvider = new RouterContextProvider();
    contextProvider.set(CloudflareContext, {
      cloudflare: { ctx, env },
      security: { nonce },
    });

    return requestHandler(request, contextProvider);
  },
} satisfies ExportedHandler<Env>;
