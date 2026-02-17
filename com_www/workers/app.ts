import { createRequestHandler, RouterContextProvider } from "react-router";
const TypedRouterContextProvider = RouterContextProvider as unknown as {
  new (): { set: (key: unknown, value: unknown) => void };
};
import { CloudflareContext } from "../src/context";

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
  () => {
    const contextProvider = new TypedRouterContextProvider();
    return contextProvider;
  },
);

export default {
  async fetch(request, env, ctx) {
    const nonce = generateNonce();

    const contextProvider = new TypedRouterContextProvider();
    contextProvider.set(CloudflareContext, {
      cloudflare: { env, ctx },
      security: { nonce },
    });

    return requestHandler(request, contextProvider);
  },
} satisfies ExportedHandler<Env>;
