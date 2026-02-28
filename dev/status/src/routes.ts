import { index, layout } from '@react-router/dev/routes';
import type { RouteConfig } from '@react-router/dev/routes';

export default [
  layout('../src/layouts/decorated.tsx', [index('routes/home.tsx')]),
] satisfies RouteConfig;
