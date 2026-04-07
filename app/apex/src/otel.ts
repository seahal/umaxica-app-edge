import type { ResolveConfigFn } from '@microlabs/otel-cf-workers';

export const otelConfig: ResolveConfigFn = (env: Record<string, unknown>, _trigger) => {
  return {
    exporter: {
      url: 'https://api.honeycomb.io/v1/traces',
      headers: { 'x-honeycomb-team': env.HONEYCOMB_API_KEY as string },
    },
    service: { name: 'app-apex' },
  };
};
