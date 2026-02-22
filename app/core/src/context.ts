import { createContext, type RouterContext } from "react-router";

export type CloudflareContextValue = {
  cloudflare?: {
    env?: Env;
    ctx?: ExecutionContext;
  };
  security?: {
    nonce?: string;
  };
};

export const CloudflareContext = createContext<CloudflareContextValue>("CloudflareContext");

export function getEnv(context: unknown): Env {
  const provider = context as RouterContextProvider | null | undefined;
  const cloudflareContext = provider?.get?.(CloudflareContext);
  const env = cloudflareContext?.cloudflare?.env;
  if (!env) {
    throw new Error(
      "Cloudflare environment is not available. Ensure the request is handled by a Cloudflare Worker.",
    );
  }
  return env;
}

export function getNonce(context: unknown): string {
  const provider = context as RouterContextProvider | null | undefined;
  const cloudflareContext = provider?.get?.(CloudflareContext);
  return cloudflareContext?.security?.nonce ?? "";
}

type RouterContextProvider = {
  get<T>(context: RouterContext<T>): T | undefined;
};
