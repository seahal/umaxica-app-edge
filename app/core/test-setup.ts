/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
vi.mock('@sentry/react-router', () => ({
  captureException: (): void => {},
  captureReactException: (): void => {},
  browserProfilingIntegration: (): { name: string } => ({ name: 'BrowserProfiling' }),
  init: (): void => {},
  reactRouterTracingIntegration: (): { name: string } => ({
    name: 'ReactRouterTracingIntegration',
  }),
}));
