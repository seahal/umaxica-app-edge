import { describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
  init: vi.fn(),
  replayIntegration: vi.fn(() => ({ name: 'replay' })),
}));

import * as instrumentation from '../src/instrumentation';

describe('instrumentation', () => {
  it('captures request errors and registers safely on every runtime', async () => {
    expect(() => instrumentation.onRequestError(new Error('request failed'))).not.toThrow();

    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    await expect(instrumentation.register()).resolves.toBeUndefined();
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    await expect(instrumentation.register()).resolves.toBeUndefined();
    vi.stubEnv('NEXT_RUNTIME', 'other');
    await expect(instrumentation.register()).resolves.toBeUndefined();
    vi.unstubAllEnvs();
  });
});
