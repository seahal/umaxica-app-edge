/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function */
vi.mock(import('@sentry/react-router'), () => ({
  captureException: (): void => {},
  init: (): void => {},
  message: (): void => {},
}));
