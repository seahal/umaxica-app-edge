import { index, layout, route } from '@react-router/dev/routes';
import type { RouteConfig } from '@react-router/dev/routes';

export default [
  route('health', 'routes/health.tsx'),
  route('sentry', 'routes/sentry.tsx'),
  layout('../src/layouts/decorated.tsx', [
    index('routes/_index.tsx'),
    route('configure', 'routes/configure.tsx'),
    route('sample', 'routes/sample.tsx'),
    route('*', 'routes/catch-all.tsx'),
  ]),
] satisfies RouteConfig;
