/// <reference types="vitest/globals" />

declare module '@cloudflare/workers-types' {
  interface Env {
    BRAND_NAME?: string;
    DEV_CORE_URL?: string;
  }
}
