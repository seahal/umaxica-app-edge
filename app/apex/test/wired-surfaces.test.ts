import { afterEach, describe, expect, it, vi } from 'vitest';

import { createApexApp } from '../src/create-apex-app';
import * as healthPage from '../src/health-page';
import * as statusPage from '../src/status-page';

const service = 'app';

afterEach(() => vi.restoreAllMocks());

/*
 * `/health.html`, `/health.json`, `/offline` and `notFound` are HTTP surfaces:
 * status, headers and bodies live in `api/*.hurl`. What Vitest can still prove
 * is that `createApexApp` wires each path to the helper this unit owns.
 * `app.request()` is the driver, never the subject.
 */
describe('apex surfaces wired to their helpers', () => {
  it('runs /health.html through renderHealthPage', async () => {
    const render = vi.spyOn(healthPage, 'renderHealthPage');
    const app = createApexApp(() => undefined, { service });
    await app.request('/health.html');
    expect(render).toHaveBeenCalled();
  });

  it('runs /health.json through renderHealthJson', async () => {
    const render = vi.spyOn(healthPage, 'renderHealthJson');
    const app = createApexApp(() => undefined, { service });
    await app.request('/health.json');
    expect(render).toHaveBeenCalled();
  });

  it('runs /offline through offlinePageMarkup', async () => {
    const markup = vi.spyOn(statusPage, 'offlinePageMarkup');
    const app = createApexApp(() => undefined, { service });
    await app.request('/offline');
    expect(markup).toHaveBeenCalled();
  });

  it('runs an unmatched path through statusPage as notFound', async () => {
    const page = vi.spyOn(statusPage, 'statusPage');
    const app = createApexApp(() => undefined, { service });
    await app.request('/no-such-apex-surface');
    // Third argument is the theme attribute; with no cookie it is `undefined`.
    // `expect.anything()` does not match that.
    expect(page).toHaveBeenCalledWith(404, expect.any(String), undefined);
  });
});
