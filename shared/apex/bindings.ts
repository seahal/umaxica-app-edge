interface RateLimiter {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
}

export interface AssetEnv {
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  BRAND_NAME?: string;
  RATE_LIMITER?: RateLimiter;
  REVISION?: {
    id: string;
    tag: string;
    timestamp: string;
  };
}

export interface ApexBindings {
  Bindings: AssetEnv;
}
