// TODO: move to test folder.
import { Hono } from 'hono';
import { apexCsrf, isAllowedApexOrigin } from '../csrf';

describe('apex CSRF config', () => {
  it('validates production and localhost apex origins', () => {
    expect(isAllowedApexOrigin('https://umaxica.com')).toBe(true);
    expect(isAllowedApexOrigin('https://umaxica.org')).toBe(true);
    expect(isAllowedApexOrigin('https://umaxica.app')).toBe(true);
    expect(isAllowedApexOrigin('https://umaxica.net')).toBe(true);
    expect(isAllowedApexOrigin('http://app.localhost:3333')).toBe(true);
    expect(isAllowedApexOrigin('https://evil.example')).toBe(false);
    expect(isAllowedApexOrigin(undefined)).toBe(false);
  });

  it('allows preview/staging origins on workers.dev', () => {
    expect(isAllowedApexOrigin('https://abc123.com-apex.workers.dev')).toBe(true);
    expect(isAllowedApexOrigin('https://preview-branch.app-apex.workers.dev')).toBe(true);
    expect(isAllowedApexOrigin('http://abc123.com-apex.workers.dev')).toBe(false);
    expect(isAllowedApexOrigin('https://workers.dev')).toBe(false);
  });

  it('rejects cross-site form POST requests', async () => {
    const app = new Hono();
    app.use('*', apexCsrf);
    app.post('/submit', (c) => c.text('ok'));

    const response = await app.request('/submit', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'sec-fetch-site': 'cross-site',
      },
      body: 'a=1',
    });

    expect(response.status).toBe(403);
  });

  it('allows requests without content-type for GET requests', async () => {
    const app = new Hono();
    app.use('*', apexCsrf);
    app.get('/data', (c) => c.text('data'));

    const response = await app.request('/data', {
      method: 'GET',
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('data');
  });
});
