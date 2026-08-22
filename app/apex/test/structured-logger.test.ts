import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ApexEnv } from '../src/create-apex-app';
import { apexStructuredLogger } from '../src/structured-logger';

afterEach(() => vi.restoreAllMocks());

/*
 * `app.request()` here is the DRIVER, not the subject. The assertion is on the
 * `console.log` / `console.warn` / `console.error` lines the middleware emits —
 * those are what `observability.logs.enabled` in wrangler.jsonc collects into
 * Workers Logs, and no HTTP client can see them. The throwaway `new Hono()` is
 * the only way to reach every severity, since the real app emits a subset.
 */

describe('apex structured logger', () => {
  it('emits every supported severity as structured JSON', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = new Hono<ApexEnv>();
    app.use(apexStructuredLogger);
    app.get('/levels', (c) => {
      const logger = c.get('logger');
      logger.warn({ condition: 'slow' });
      logger.error({ condition: 'failed' }, 'request failed');
      logger.debug({ condition: 'trace' }, 'request trace');
      return c.text('ok');
    });

    expect((await app.request('/levels')).status).toBe(200);
    expect(warn).toHaveBeenCalledWith(
      JSON.stringify({ level: 'warn', data: { condition: 'slow' } }),
    );
    expect(error).toHaveBeenCalledWith(
      JSON.stringify({ level: 'error', msg: 'request failed', data: { condition: 'failed' } }),
    );
    expect(log).toHaveBeenCalledWith(
      JSON.stringify({ level: 'debug', msg: 'request trace', data: { condition: 'trace' } }),
    );
  });
});
