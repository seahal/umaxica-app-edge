import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apexStructuredLogger } from '../src/structured-logger';

afterEach(() => vi.restoreAllMocks());

describe('apex structured logger', () => {
  it('emits every supported severity as structured JSON', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const app = new Hono();
    app.use(apexStructuredLogger);
    app.get('/levels', (c) => {
      const logger = c.get('logger') as {
        warn(data: unknown, message?: string): void;
        error(data: unknown, message?: string): void;
        debug(data: unknown, message?: string): void;
      };
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
