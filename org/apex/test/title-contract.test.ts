import { describe, expect, it } from 'vitest';
import app from '../src/index';
import { createApexApp } from '../src/create-apex-app';
import { expectTitleContract } from './utils/title-contract';

const env = { CF_VERSION_METADATA: {} };

describe('apex HTML routes', () => {
  it('serves contract-conforming HTML on every route', async () => {
    for (const path of ['/about', '/health', '/health.html', '/offline']) {
      const response = await app.request(path, {}, env);
      expect(response.headers.get('content-type'), path).toContain('text/html');
      expectTitleContract(await response.text(), {
        requirePageSpecific: true,
        label: `apex ${path}`,
      });
    }

    const notFound = await app.request('/definitely-missing', {}, env);
    expect(notFound.status).toBe(404);
    expectTitleContract(await notFound.text(), {
      requirePageSpecific: true,
      label: 'apex 404',
    });
  });

  it('serves a contract-conforming 500 document', async () => {
    const boom = createApexApp(
      (pageRoutes) => {
        pageRoutes.get('/boom', () => {
          throw new Error('induced failure');
        });
      },
      { service: 'org' },
    );

    const response = await boom.request('/boom', {}, env);
    expect(response.status).toBe(500);
    expectTitleContract(await response.text(), {
      requirePageSpecific: true,
      label: 'apex 500',
    });
  });

  it('leaves non-HTML responses untouched', async () => {
    const healthJson = await app.request('/health.json', {}, env);
    expect(healthJson.headers.get('content-type')).toContain('application/json');
    const health = (await healthJson.json()) as Record<string, unknown>;
    expect(Object.keys(health).sort()).toEqual(
      ['edge', 'environment', 'service', 'status', 'time', 'version'].sort(),
    );
    expect(health).not.toHaveProperty('title');

    const revision = await app.request('/revision', {}, env);
    expect(revision.headers.get('content-type')).toContain('application/json');
    const body = (await revision.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['id', 'tag', 'timestamp']);
    expect(body).not.toHaveProperty('title');

    // The apex root is a redirect, not an HTML document.
    const root = await app.request('/', {}, env);
    expect([301, 302, 400]).toContain(root.status);
  });
});
