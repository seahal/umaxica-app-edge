import { index, layout, route } from '@react-router/dev/routes';
import type { RouteConfig } from '@react-router/dev/routes';

export default [
  layout('../src/layouts/decorated.tsx', [
    index('routes/_index.tsx'),
    route('configure', 'routes/configure.tsx'),
    route('*', 'routes/catch-all.tsx'),
  ]),
  layout('../src/layouts/baremetal.tsx', [route('/health', 'routes/healths/_index.tsx')]),
] satisfies RouteConfig;
